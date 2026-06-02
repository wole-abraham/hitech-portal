import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ok, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('surveycollection_machinestatusreport')
    .select('id, date_time, fleet_number, machine_type, machine_belonging, deployment_state, machine_status, breakdown_issue, assigned_to, reporter_name, litres, hour_meter, registry_item_id')
    .order('date_time', { ascending: false })

  if (error) return err(error.message)
  return ok(data ?? [])
}
