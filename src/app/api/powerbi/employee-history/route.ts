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
  const employeeId = searchParams.get('employee_id') || ''
  const name       = searchParams.get('name')        || ''
  const field      = searchParams.get('field')       || ''
  const dateFrom   = searchParams.get('date_from')   || ''
  const dateTo     = searchParams.get('date_to')     || ''

  let q = supabase
    .from('surveycollection_employee_history')
    .select('id, employee_id, employee_name, field_name, old_value, new_value, changed_by, changed_at')
    .order('changed_at', { ascending: false })

  if (employeeId) {
    const eid = parseInt(employeeId)
    if (isNaN(eid)) return err('Invalid employee_id', 400)
    q = (q as any).eq('employee_id', eid)
  }
  if (name)     q = (q as any).ilike('employee_name', `%${name}%`)
  if (field)    q = (q as any).ilike('field_name',    `%${field}%`)
  if (dateFrom) q = (q as any).gte('changed_at', dateFrom)
  if (dateTo)   q = (q as any).lte('changed_at', dateTo)

  const { data, error } = await fetchAll(q)
  if (error) return err(error.message)
  return respond(req, data)
}
