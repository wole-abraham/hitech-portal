import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSession(req: NextRequest) {
  const res = NextResponse.json({})
  return getIronSession<AppSession>(req, res, sessionOptions)
}

function planFields(body: any, createdBy?: string) {
  return {
    title:                       body.title?.trim(),
    description:                 body.description || null,
    project_name:                body.project_name || null,
    section_name:                body.section_name || null,
    activity_category:           body.activity_category || null,
    activity_type:               body.activity_type || null,
    activity_subtype:            body.activity_subtype || null,
    side:                        body.side || null,
    weather:                     body.weather || null,
    start_chainage:              body.start_chainage || null,
    end_chainage:                body.end_chainage || null,
    activity_status:             body.activity_status || null,
    party_for_activity:          body.party_for_activity || null,
    subcontractor_name_activity: body.subcontractor_name_activity || null,
    comment_activity:            body.comment_activity || null,
    not_conforming:              body.not_conforming || 'No',
    not_conforming_issue:        body.not_conforming_issue || null,
    not_conforming_correction:   body.not_conforming_correction || null,
    car_used:                    body.car_used || 'No',
    team_car:                    body.team_car || null,
    custom_data:                 body.custom_data && typeof body.custom_data === 'object' ? body.custom_data : null,
    ...(createdBy ? { created_by: createdBy } : {}),
  }
}

async function saveSubRecords(planId: number, body: any) {
  const failures: string[] = []

  // Replace employees
  await supabase.from('hitech_plan_employee').delete().eq('plan_id', planId)
  if (body.employees?.length) {
    const { error } = await supabase.from('hitech_plan_employee').insert(
      body.employees
        .filter((e: any) => e.name || e.missing_name)
        .map((e: any) => ({
          plan_id:               planId,
          employee_name:         e.name !== '__other__' ? (e.name || '') : '',
          employee_role:         e.role || '',
          party:                 e.party || 'Employee',
          subcontractor_name:    e.subcontractor_name || '',
          employee_missing_name: e.name === '__other__' ? (e.missing_name || '') : '',
        }))
    )
    if (error) failures.push('employees: ' + error.message)
  }

  // Replace supervisors
  await supabase.from('hitech_plan_supervisor').delete().eq('plan_id', planId)
  if (body.supervisors?.length) {
    const { error } = await supabase.from('hitech_plan_supervisor').insert(
      body.supervisors
        .filter((s: any) => s.name || s.missing_name)
        .map((s: any) => ({
          plan_id:                planId,
          supervisor_name:        s.name !== '__other__' ? (s.name || '') : '',
          party:                  s.party || `${process.env.NEXT_PUBLIC_APP_NAME || 'Company'} employees`,
          subcontractor_name:     s.subcontractor_name || '',
          supervisor_missing_name: s.name === '__other__' ? (s.missing_name || '') : '',
        }))
    )
    if (error) failures.push('supervisors: ' + error.message)
  }

  // Replace machines
  await supabase.from('hitech_plan_machine').delete().eq('plan_id', planId)
  if (body.machines?.length) {
    const { error } = await supabase.from('hitech_plan_machine').insert(
      body.machines
        .filter((m: any) => m.machine_name || m.fleet_number)
        .map((m: any) => ({
          plan_id:          planId,
          fleet_number:     m.fleet_number || '',
          machine_name:     m.machine_name || '',
          machine_belonging: m.machine_belonging || '',
          driver_name:      m.driver_name || '',
        }))
    )
    if (error) failures.push('machines: ' + error.message)
  }

  return failures
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.role === 'admin'
  const showAll = new URL(req.url).searchParams.get('all') === 'true' && isAdmin

  let q = supabase
    .from('hitech_report_plannedactivity')
    .select('*')
    .order('created_at', { ascending: false })

  if (!showAll) q = (q as any).eq('is_active', true)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let items = data ?? []

  if (!isAdmin) {
    const today = new Date().toISOString().split('T')[0]

    // Look up the worker's assigned project and section
    const { data: emp } = await supabase
      .from('surveycollection_employee')
      .select('project_name, section_name')
      .eq('user_id', session.user.id)
      .limit(1)

    const workerProject = emp?.[0]?.project_name ?? null
    const workerSection = emp?.[0]?.section_name ?? null

    if (!workerProject) {
      return NextResponse.json({ items: [], unassigned: true })
    }

    items = items.filter((item: any) => {
      // Must be scheduled for today or earlier (or no date set)
      const scheduled = item.custom_data?.scheduled_date
      if (scheduled && scheduled > today) return false

      // Must match worker's project (if the plan has one set)
      if (item.project_name && item.project_name !== workerProject) return false

      // Must match worker's section (if the plan has one set)
      if (item.section_name && item.section_name !== workerSection) return false

      return true
    })
  }

  // Fetch report counts for each plan
  const ids = items.map((i: any) => i.id)
  let countMap: Record<number, number> = {}
  if (ids.length > 0) {
    const { data: counts } = await supabase
      .from('hitech_report_hitechreport')
      .select('planned_activity_id')
      .in('planned_activity_id', ids)
    ;(counts ?? []).forEach((r: any) => {
      countMap[r.planned_activity_id] = (countMap[r.planned_activity_id] ?? 0) + 1
    })
  }

  const itemsWithCounts = items.map((i: any) => ({ ...i, report_count: countMap[i.id] ?? 0 }))

  return NextResponse.json({ items: itemsWithCounts })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.title?.trim() && !body.custom_data?.scheduled_date) return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 })

  const createdBy = session.user.username || `${session.user.first_name} ${session.user.last_name}`.trim()
  const { data, error } = await supabase
    .from('hitech_report_plannedactivity')
    .insert({ ...planFields(body, createdBy), is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const failures = await saveSubRecords(data.id, body)
  if (failures.length) return NextResponse.json({ item: data, warnings: failures }, { status: 207 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, employees, supervisors, machines, report_count, ...rest } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Snapshot current state before update
  const { data: before } = await supabase
    .from('hitech_report_plannedactivity')
    .select('title, project_name, section_name, activity_category, activity_type, activity_subtype, side, activity_status, start_chainage, end_chainage, weather, party_for_activity, not_conforming, car_used')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('hitech_report_plannedactivity')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Write history snapshot
  if (before) {
    const changedBy = session.user.username || `${session.user.first_name} ${session.user.last_name}`.trim()
    await supabase.from('hitech_plan_activity_history').insert({
      plan_id:            id,
      plan_title:         before.title,
      project_name:       before.project_name,
      section_name:       before.section_name,
      activity_category:  before.activity_category,
      activity_type:      before.activity_type,
      activity_subtype:   before.activity_subtype,
      side:               before.side,
      activity_status:    before.activity_status,
      start_chainage:     before.start_chainage,
      end_chainage:       before.end_chainage,
      weather:            before.weather,
      party_for_activity: before.party_for_activity,
      not_conforming:     before.not_conforming,
      car_used:           before.car_used,
      changed_by:         changedBy,
    })
  }

  // Only replace sub-records if they were sent in the request
  if (employees !== undefined || supervisors !== undefined || machines !== undefined) {
    await saveSubRecords(id, { employees, supervisors, machines })
  }

  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('hitech_report_plannedactivity')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
