import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'
import { notifyMachineAssigned, notifyMachineUnassigned } from '@/lib/notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
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

  const { assigned_to, litres, hour_meter, concrete_cubic_meters, diesel_status } = await req.json()

  const { data: machine } = await supabase
    .from('surveycollection_planningtable')
    .select('*')
    .eq('id', id)
    .single()

  if (!machine) return NextResponse.json({ error: 'Machine not found' }, { status: 404 })

  if (machine.deployment_status === 'received_on_site') {
    return NextResponse.json({
      error: `${machine.assigned_to} has confirmed receipt — they must return it before reassignment.`
    }, { status: 409 })
  }

  const adminName = `${session.user.first_name} ${session.user.last_name}`.trim() || session.user.email

  if (assigned_to) {
    const machineUpdate: Record<string, unknown> = { assigned_to, deployment_status: 'deployed_to_site' }
    if (litres != null)      machineUpdate.litres      = litres
    if (hour_meter != null)  machineUpdate.hour_meter  = hour_meter

    await supabase
      .from('surveycollection_planningtable')
      .update(machineUpdate)
      .eq('id', id)

    const noteParts = [`Assigned to ${assigned_to}`]
    if (diesel_status === 'still_there') noteParts.push('Diesel: still there')
    else if (litres != null)             noteParts.push(`Fuel added: ${litres}L`)
    if (hour_meter != null)              noteParts.push(`Meter: ${hour_meter}h`)
    if (concrete_cubic_meters != null)   noteParts.push(`Concrete: ${concrete_cubic_meters}m³`)

    await supabase.from('surveycollection_machinestatusreport').insert({
      date_time: new Date().toISOString(),
      machine_type: machine.machine_type || '',
      machine_belonging: machine.machine_belonging || '',
      fleet_number: machine.fleet_number || '',
      deployment_state: 'Deployed to site',
      machine_status: machine.health_status || '',
      breakdown_issue: noteParts.join(' · '),
      registry_item_id: id,
      assigned_to,
      reporter_name: adminName,
      ...(litres != null     && { litres }),
      ...(hour_meter != null && { hour_meter }),
    })

    // Look up the worker's email so they get a personal copy
    const { data: empRow } = await supabase
      .from('surveycollection_employee')
      .select('user_id')
      .eq('name', assigned_to)
      .limit(1)
      .single()

    let workerEmail: string | null = null
    let workerFirstName: string | null = null
    if (empRow?.user_id) {
      const { data: userRow } = await supabase
        .from('auth_user')
        .select('email, first_name')
        .eq('id', empRow.user_id)
        .single()
      workerEmail     = userRow?.email      || null
      workerFirstName = userRow?.first_name || null
    }

    notifyMachineAssigned({
      fleet_number:       machine.fleet_number       || '',
      machine_type:       machine.machine_type       || '',
      machine_belonging:  machine.machine_belonging  || '',
      assigned_to,
      by_admin:           adminName,
      litres,
      hour_meter,
      worker_email:       workerEmail,
      worker_first_name:  workerFirstName,
    })
  } else {
    await supabase
      .from('surveycollection_planningtable')
      .update({ assigned_to: null, deployment_status: 'Active' })
      .eq('id', id)

    await supabase.from('surveycollection_machinestatusreport').insert({
      date_time: new Date().toISOString(),
      machine_type: machine.machine_type || '',
      machine_belonging: machine.machine_belonging || '',
      fleet_number: machine.fleet_number || '',
      deployment_state: 'Unassigned',
      machine_status: machine.health_status || '',
      breakdown_issue: `Unassigned from ${machine.assigned_to}`,
      registry_item_id: id,
      assigned_to: '',
      reporter_name: adminName,
    })

    notifyMachineUnassigned(machine.fleet_number || '', machine.assigned_to || '', adminName)
  }

  return NextResponse.json({ ok: true })
}
