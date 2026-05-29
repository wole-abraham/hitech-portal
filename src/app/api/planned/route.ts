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
          party:                  s.party || 'Hitech employees',
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

  // Workers only see plans whose scheduled_date has arrived (or plans with no date set)
  if (!isAdmin) {
    const today = new Date().toISOString().split('T')[0]
    items = items.filter((item: any) => {
      const scheduled = item.custom_data?.scheduled_date
      if (!scheduled) return true
      return scheduled <= today
    })
  }

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

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
  const { id, employees, supervisors, machines, ...rest } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('hitech_report_plannedactivity')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
