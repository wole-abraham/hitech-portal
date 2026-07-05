import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { respond, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchAll(query: any) {
  const rows: any[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await query.range(from, from + PAGE - 1)
    if (error) return { data: rows, error }
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return { data: rows, error: null }
}

export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fleet      = searchParams.get('fleet_number')       || ''
  const status     = searchParams.get('machine_status')     || ''
  const belonging  = searchParams.get('machine_belonging')  || ''
  const dateFrom   = searchParams.get('date_from')          || ''
  const dateTo     = searchParams.get('date_to')            || ''

  let q = supabase
    .from('surveycollection_machinestatusreport')
    .select('id, date_time, fleet_number, machine_type, machine_belonging, deployment_state, machine_status, breakdown_issue, assigned_to, reporter_name, litres, hour_meter, registry_item_id')
    .order('date_time', { ascending: false })

  if (fleet)     q = (q as any).ilike('fleet_number',      `%${fleet}%`)
  if (status)    q = (q as any).ilike('machine_status',    `%${status}%`)
  if (belonging) q = (q as any).ilike('machine_belonging', `%${belonging}%`)
  if (dateFrom)  q = (q as any).gte('date_time', dateFrom)
  if (dateTo)    q = (q as any).lte('date_time', dateTo)

  const { data, error } = await fetchAll(q)
  if (error) return err(error.message)
  return respond(req, data)
}
