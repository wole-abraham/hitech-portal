import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

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

  // Fetch current machine state
  const { data: machine, error: fetchError } = await supabase
    .from('surveycollection_planningtable')
    .select('id, fleet_number, machine_type, machine_belonging, deployment_status, health_status')
    .eq('id', id)
    .single()

  if (fetchError || !machine) return NextResponse.json({ error: 'Machine not found.' }, { status: 404 })

  if (machine.deployment_status !== 'in_transit_back') {
    return NextResponse.json({ error: `Machine is not in transit — current status is '${machine.deployment_status}'.` }, { status: 409 })
  }

  const adminName = `${session.user.first_name} ${session.user.last_name}`.trim() || session.user.email

  // Mark machine as back in store
  const { error: updateError } = await supabase
    .from('surveycollection_planningtable')
    .update({ deployment_status: 'in_store' })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Log history entry
  await supabase.from('surveycollection_machinestatusreport').insert({
    date_time: new Date().toISOString(),
    machine_type: machine.machine_type || '',
    machine_belonging: machine.machine_belonging || 'Hitech',
    fleet_number: machine.fleet_number || '',
    deployment_state: 'Received at head office',
    machine_status: machine.health_status || '',
    breakdown_issue: '',
    registry_item_id: machine.id,
    assigned_to: '',
    reporter_name: adminName,
  })

  return NextResponse.json({ ok: true })
}
