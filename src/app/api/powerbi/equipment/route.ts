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
    .from('surveycollection_planningtable')
    .select('id, fleet_number, machine_type, machine_belonging, deployment_status, health_status, project_name, section_name, assigned_to, operator_comment, litres, hour_meter')
    .order('fleet_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
