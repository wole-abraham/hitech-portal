import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'
import { parseChainage } from '@/lib/parseChainage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Fix #1: normalize chainage direction once, use same values for overlap check AND storage
  const { project_name, section_name, activity_category, start_chainage, end_chainage } = body
  const rawStart = parseChainage(start_chainage)
  const rawEnd = parseChainage(end_chainage)
  const normStart = Math.min(rawStart, rawEnd)
  const normEnd = Math.max(rawStart, rawEnd)

  if (project_name && activity_category && start_chainage && end_chainage) {
    const { data: overlaps } = await supabase
      .from('hitech_report_hitechreport')
      .select('id, start_chainage, end_chainage')
      .eq('project_name', project_name)
      .eq('section_name', section_name || '')
      .eq('activity_category', activity_category)
      .lt('start_chainage_val', normEnd)
      .gt('end_chainage_val', normStart)
      .limit(1)

    if (overlaps && overlaps.length > 0) {
      const ex = overlaps[0]
      return NextResponse.json({
        error: `Submission denied: The range ${start_chainage} → ${end_chainage} overlaps with an existing ${activity_category} report (${ex.start_chainage} → ${ex.end_chainage}) for this section.`
      }, { status: 409 })
    }
  }

  // Insert main report — fix #1: store normalized chainage_val
  const { data: report, error: reportError } = await supabase
    .from('hitech_report_hitechreport')
    .insert({
      submitted_by_id: session.user.id,
      submitted_at: new Date().toISOString(),
      date_of_activity: body.date_of_activity || null,
      reporter_name: body.reporter_name || '',
      weather: body.weather || '',
      project_name: body.project_name || '',
      section_name: body.section_name || '',
      activity_category: body.activity_category || '',
      activity_type: body.activity_type || '',
      activity_subtype: body.activity_subtype || '',
      side: body.side || '',
      start_chainage: body.start_chainage || '',
      start_chainage_long: body.start_chainage_long || '',
      start_chainage_lat: body.start_chainage_lat || '',
      end_chainage: body.end_chainage || '',
      end_chainage_long: body.end_chainage_long || '',
      end_chainage_lat: body.end_chainage_lat || '',
      start_chainage_val: normStart,
      end_chainage_val: normEnd,
      comment_activity: body.comment_activity || '',
      not_conforming: body.not_conforming || '',
      not_conforming_issue: body.not_conforming_issue || '',
      not_conforming_correction: body.not_conforming_correction || '',
      car_used: body.car_used || '',
      team_car: body.team_car || '',
      party_for_activity: body.party_for_activity || '',
      subcontractor_name_activity: body.subcontractor_name_activity || '',
      activity_status: body.activity_status || '',
    })
    .select('id')
    .single()

  if (reportError || !report) {
    return NextResponse.json({ error: 'Failed to save report: ' + reportError?.message }, { status: 500 })
  }

  const reportId = report.id

  // Fix #3: check errors on all sub-inserts, collect failures
  const failures: string[] = []

  if (body.employees?.length) {
    const { error } = await supabase.from('hitech_report_hitechemployee').insert(
      body.employees.map((e: any) => ({
        report_id: reportId,
        employee_name: e.name || '',
        employee_role: e.role || '',
        employee_missing_name: e.missing_name || '',
      }))
    )
    if (error) failures.push('employees: ' + error.message)
  }

  if (body.supervisors?.length) {
    const { error } = await supabase.from('hitech_report_hitechsupervisor').insert(
      body.supervisors.map((s: any) => ({
        report_id: reportId,
        supervisor_name: s.name || '',
        party: s.party || '',
        subcontractor_name: s.subcontractor_name || '',
        supervisor_missing_name: s.missing_name || '',
      }))
    )
    if (error) failures.push('supervisors: ' + error.message)
  }

  if (body.engineers?.length) {
    const { error } = await supabase.from('hitech_report_hitechengineer').insert(
      body.engineers.map((e: any) => ({
        report_id: reportId,
        engineer_name: e.name || '',
        party: e.party || '',
        subcontractor_name: e.subcontractor_name || '',
        engineer_missing_name: e.missing_name || '',
      }))
    )
    if (error) failures.push('engineers: ' + error.message)
  }

  if (body.machines?.length) {
    const { error } = await supabase.from('hitech_report_hitechmachine').insert(
      body.machines.map((m: any) => ({
        report_id: reportId,
        fleet_number: m.fleet_number || '',
        ownership: m.machine_belonging || '',
        machine_name: m.machine_name || '',
        plate_number: m.fleet_number || '',
        driver_name: m.driver_name || '',
        driver_missing_name: '',
      }))
    )
    if (error) failures.push('machines: ' + error.message)
  }

  if (body.photo_urls?.length) {
    const { error } = await supabase.from('hitech_report_hitechphoto').insert(
      body.photo_urls.map((url: string) => ({
        report_id: reportId,
        media_type: 'image',
        file: url,
        uploaded_at: new Date().toISOString(),
      }))
    )
    if (error) failures.push('photos: ' + error.message)
  }

  if (body.video_url) {
    const { error } = await supabase.from('hitech_report_hitechphoto').insert({
      report_id: reportId,
      media_type: 'video',
      file: body.video_url,
      uploaded_at: new Date().toISOString(),
    })
    if (error) failures.push('video: ' + error.message)
  }

  if (failures.length > 0) {
    console.error(`Report ${reportId} saved with partial data:`, failures)
    return NextResponse.json({ ok: true, id: reportId, warnings: failures }, { status: 207 })
  }

  return NextResponse.json({ ok: true, id: reportId })
}
