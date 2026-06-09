import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { respond, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAGE = 1000

async function fetchAll(query: any) {
  const rows: any[] = []
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
  const q = supabase
    .from('surveycollection_employee')
    .select('id, name, role, status, phone_number, email, project_name, section_name, nationality, gender, date_of_birth, date_added, notes')
    .order('name')

  const { data, error } = await fetchAll(q)
  if (error) return err(error.message)
  return respond(req, data)
}
