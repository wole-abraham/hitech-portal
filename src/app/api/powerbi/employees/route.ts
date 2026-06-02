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
    .from('surveycollection_employee')
    .select('id, name, role, status, phone_number, email, project_name, section_name, nationality, gender, date_of_birth, date_added, notes')
    .order('name')

  if (error) return err(error.message)
  return respond(req, data ?? [])
}
