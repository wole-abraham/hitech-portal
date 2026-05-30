import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { id: rawId } = await params
  const id = parseInt(rawId)
  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const body = await req.json()
  const { fleet_number, machine_type, machine_belonging, deployment_status, health_status, project_name, section_name } = body

  // Fetch current state before update so we can diff
  const { data: current } = await supabase
    .from('surveycollection_planningtable')
    .select('*')
    .eq('id', id)
    .single()

  // Don't allow changing admin-side deployment_status while machine is in worker lifecycle
  const WORKER_LIFECYCLE = ['deployed_to_site', 'received_on_site', 'in_transit_back']
  const effectiveStatus = WORKER_LIFECYCLE.includes(current?.deployment_status)
    ? current.deployment_status
    : deployment_status

  const { data, error } = await supabase
    .from('surveycollection_planningtable')
    .update({ fleet_number, machine_type, machine_belonging, deployment_status: effectiveStatus, health_status, project_name, section_name })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build a change summary and pick an event label
  if (current) {
    const adminName = `${session.user.first_name} ${session.user.last_name}`.trim() || session.user.email

    const changes: string[] = []
    if (current.deployment_status !== effectiveStatus)
      changes.push(`Status: ${current.deployment_status} → ${effectiveStatus}`)
    if (current.health_status !== health_status)
      changes.push(`Health: ${current.health_status} → ${health_status}`)
    if ((current.project_name || '') !== (project_name || ''))
      changes.push(`Project: ${project_name || '—'}`)
    if ((current.section_name || '') !== (section_name || ''))
      changes.push(`Section: ${section_name || '—'}`)
    if ((current.machine_type || '') !== (machine_type || ''))
      changes.push(`Type: ${machine_type}`)
    if ((current.fleet_number || '') !== (fleet_number || ''))
      changes.push(`Fleet No.: ${fleet_number}`)
    if ((current.machine_belonging || '') !== (machine_belonging || ''))
      changes.push(`Owner: ${machine_belonging}`)

    // Only log if something actually changed
    if (changes.length > 0) {
      let eventLabel = 'Details updated'
      if (current.deployment_status !== effectiveStatus) eventLabel = `Status → ${effectiveStatus}`
      else if (current.health_status !== health_status) eventLabel = `Health → ${health_status}`

      await supabase.from('surveycollection_machinestatusreport').insert({
        date_time: new Date().toISOString(),
        machine_type: machine_type || current.machine_type || '',
        machine_belonging: machine_belonging || current.machine_belonging || '',
        fleet_number: fleet_number || current.fleet_number || '',
        deployment_state: eventLabel,
        machine_status: health_status || current.health_status || '',
        breakdown_issue: changes.join(' · '),
        registry_item_id: id,
        assigned_to: current.assigned_to || '',
        reporter_name: adminName,
      })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { id: rawId } = await params
  const id = parseInt(rawId)
  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Remove machine status history linked to this registry item
  await supabase.from('surveycollection_machinestatusreport').delete().eq('registry_item_id', id)

  const { error } = await supabase
    .from('surveycollection_planningtable')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
