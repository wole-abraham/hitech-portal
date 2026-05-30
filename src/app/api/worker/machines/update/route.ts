import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ACTION_STATE: Record<string, string> = {
  receive: 'Received on site',
  return:  'Sent back to head office',
}

const ACTION_STATUS: Record<string, string> = {
  receive: 'received_on_site',
  return:  'in_transit_back',
}

// Fix #4: valid source states for each action
const VALID_FROM: Record<string, string[]> = {
  receive: ['deployed_to_site'],
  return:  ['received_on_site'],
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { machine_id, action, health_status, comment, litres, hour_meter } = await req.json()

  if (!machine_id || !action || !ACTION_STATE[action]) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: employees } = await supabase
    .from('surveycollection_employee')
    .select('id, name')
    .eq('user_id', session.user.id)
    .limit(1)

  if (!employees || employees.length === 0) {
    return NextResponse.json({ error: 'No employee profile found for your account.' }, { status: 403 })
  }

  const employeeName = employees[0].name

  const { data: machines } = await supabase
    .from('surveycollection_planningtable')
    .select('id, fleet_number, machine_type, machine_belonging, assigned_to, health_status, deployment_status')
    .eq('id', machine_id)
    .limit(1)

  if (!machines || machines.length === 0) {
    return NextResponse.json({ error: 'Machine not found.' }, { status: 404 })
  }

  const machine = machines[0]

  if (machine.assigned_to !== employeeName) {
    return NextResponse.json({ error: 'This machine is not assigned to you.' }, { status: 403 })
  }

  // Fix #4: guard against invalid state transitions
  if (!VALID_FROM[action].includes(machine.deployment_status)) {
    return NextResponse.json({
      error: `Cannot ${action} a machine that is currently '${machine.deployment_status}'.`
    }, { status: 409 })
  }

  const newHealthStatus = health_status || machine.health_status
  const newDeploymentStatus = ACTION_STATUS[action]

  const updatePayload: Record<string, string | number | null> = {
    deployment_status: newDeploymentStatus,
    health_status: newHealthStatus,
    operator_comment: comment || '',
  }

  if (litres != null && !isNaN(Number(litres))) updatePayload.litres = Number(litres)
  if (hour_meter != null && !isNaN(Number(hour_meter))) updatePayload.hour_meter = Number(hour_meter)

  if (action === 'return') {
    updatePayload.assigned_to = null
    // Keep project_name/section_name so admin can see where the machine came from
  }

  await supabase
    .from('surveycollection_planningtable')
    .update(updatePayload)
    .eq('id', machine_id)

  const historyEntry: Record<string, string | number | null> = {
    date_time: new Date().toISOString(),
    machine_type: machine.machine_type || '',
    machine_belonging: machine.machine_belonging || 'Hitech',
    fleet_number: machine.fleet_number || '',
    deployment_state: ACTION_STATE[action],
    machine_status: newHealthStatus,
    breakdown_issue: comment || '',
    registry_item_id: machine.id,
    assigned_to: employeeName,
    reporter_name: employeeName,
  }
  if (litres != null && !isNaN(Number(litres))) historyEntry.litres = Number(litres)
  if (hour_meter != null && !isNaN(Number(hour_meter))) historyEntry.hour_meter = Number(hour_meter)

  await supabase.from('surveycollection_machinestatusreport').insert(historyEntry)

  return NextResponse.json({ ok: true })
}
