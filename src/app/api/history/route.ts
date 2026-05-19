import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search  = searchParams.get('search') || ''
  const fleet   = searchParams.get('fleet') || ''
  const action  = searchParams.get('action') || ''
  const page    = parseInt(searchParams.get('page') || '0')

  let query = supabase
    .from('surveycollection_machinestatusreport')
    .select('*', { count: 'exact' })
    .order('date_time', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  if (fleet)  query = query.eq('fleet_number', fleet)
  if (action) query = query.eq('deployment_state', action)
  if (search) query = query.or(
    `fleet_number.ilike.%${search}%,reporter_name.ilike.%${search}%,assigned_to.ilike.%${search}%,machine_type.ilike.%${search}%`
  )

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch distinct fleets and action types for filter dropdowns
  const [{ data: fleets }, { data: actions }] = await Promise.all([
    supabase.from('surveycollection_machinestatusreport').select('fleet_number').order('fleet_number'),
    supabase.from('surveycollection_machinestatusreport').select('deployment_state').order('deployment_state'),
  ])

  const uniqueFleets  = [...new Set<string>((fleets  ?? []).map((r: any) => r.fleet_number).filter(Boolean))]
  const uniqueActions = [...new Set<string>((actions ?? []).map((r: any) => r.deployment_state).filter(Boolean))]

  return NextResponse.json({ entries: data ?? [], total: count ?? 0, fleets: uniqueFleets, actions: uniqueActions })
}
