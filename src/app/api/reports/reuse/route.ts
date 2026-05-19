import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Workers see only their own reports; admins see all
  let query = supabase
    .from('hitech_report_hitechreport')
    .select('id, date_of_activity, reporter_name, project_name, section_name, activity_category, activity_type, activity_subtype, side, start_chainage, end_chainage, comment_activity, not_conforming, not_conforming_issue, not_conforming_correction, car_used, team_car, party_for_activity, subcontractor_name_activity')
    .order('submitted_at', { ascending: false })
    .limit(20)

  if (session.user.role !== 'admin') {
    query = query.eq('submitted_by_id', session.user.id)
  }

  const { data: reports, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!reports?.length) return NextResponse.json({ reports: [] })

  // Fetch related rows for all reports in parallel
  const ids = reports.map(r => r.id)

  const [empRes, supRes, engRes, machRes] = await Promise.all([
    supabase.from('hitech_report_hitechemployee').select('report_id, employee_name, employee_role, employee_missing_name').in('report_id', ids),
    supabase.from('hitech_report_hitechsupervisor').select('report_id, supervisor_name, supervisor_missing_name, party, subcontractor_name').in('report_id', ids),
    supabase.from('hitech_report_hitechengineer').select('report_id, engineer_name, engineer_missing_name, party, subcontractor_name').in('report_id', ids),
    supabase.from('hitech_report_hitechmachine').select('report_id, ownership, machine_name, plate_number, driver_name').in('report_id', ids),
  ])

  const byReport = (rows: any[] | null, key = 'report_id') => {
    const map: Record<number, any[]> = {}
    for (const r of rows ?? []) {
      if (!map[r[key]]) map[r[key]] = []
      map[r[key]].push(r)
    }
    return map
  }

  const empMap  = byReport(empRes.data)
  const supMap  = byReport(supRes.data)
  const engMap  = byReport(engRes.data)
  const machMap = byReport(machRes.data)

  const enriched = reports.map(r => ({
    ...r,
    employees:   empMap[r.id]  ?? [],
    supervisors: supMap[r.id]  ?? [],
    engineers:   engMap[r.id]  ?? [],
    machines:    machMap[r.id] ?? [],
  }))

  return NextResponse.json({ reports: enriched })
}
