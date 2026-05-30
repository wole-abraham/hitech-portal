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

  const { assigned_to } = await req.json()

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
    await supabase
      .from('surveycollection_planningtable')
      .update({ assigned_to, deployment_status: 'deployed_to_site' })
      .eq('id', id)

    await supabase.from('surveycollection_machinestatusreport').insert({
      date_time: new Date().toISOString(),
      machine_type: machine.machine_type || '',
      machine_belonging: machine.machine_belonging || '',
      fleet_number: machine.fleet_number || '',
      deployment_state: 'Deployed to site',
      machine_status: machine.health_status || '',
      breakdown_issue: `Assigned to ${assigned_to}`,
      registry_item_id: id,
      assigned_to,
      reporter_name: adminName,
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
  }

  return NextResponse.json({ ok: true })
}
