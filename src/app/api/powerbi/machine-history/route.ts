import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkApiKey } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  const { data, error } = await supabase
    .from('surveycollection_machinestatusreport')
    .select('id, date_time, fleet_number, machine_type, machine_belonging, deployment_state, machine_status, breakdown_issue, assigned_to, reporter_name, litres, hour_meter, registry_item_id')
    .order('date_time', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
