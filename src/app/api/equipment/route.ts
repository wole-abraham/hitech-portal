import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSession(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireSession(req)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('surveycollection_planningtable')
    .select('*')
    .order('fleet_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const { fleet_number, machine_type, machine_belonging, deployment_status, health_status, project_name, section_name, assigned_to } = body

  const { data, error } = await supabase
    .from('surveycollection_planningtable')
    .insert({ fleet_number, machine_type, machine_belonging, deployment_status, health_status, project_name, section_name, assigned_to: assigned_to || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const adminName = `${session.user.first_name} ${session.user.last_name}`.trim() || session.user.email

  const details: string[] = []
  if (deployment_status) details.push(`Status: ${deployment_status}`)
  if (health_status)     details.push(`Health: ${health_status}`)
  if (assigned_to)       details.push(`Assigned to ${assigned_to}`)
  if (project_name)      details.push(`Project: ${project_name}`)

  await supabase.from('surveycollection_machinestatusreport').insert({
    date_time: new Date().toISOString(),
    machine_type: machine_type || '',
    machine_belonging: machine_belonging || '',
    fleet_number: fleet_number || '',
    deployment_state: 'Added to fleet',
    machine_status: health_status || '',
    breakdown_issue: details.join(' · '),
    registry_item_id: data.id,
    assigned_to: assigned_to || '',
    reporter_name: adminName,
  })

  return NextResponse.json(data, { status: 201 })
}
