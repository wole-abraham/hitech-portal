import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { respond, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('surveycollection_planningtable')
    .select('id, fleet_number, machine_type, machine_belonging, deployment_status, health_status, project_name, section_name, assigned_to, operator_comment, litres, hour_meter')
    .order('fleet_number')

  if (error) return err(error.message)
  return respond(req, data ?? [])
}
