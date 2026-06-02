import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { respond, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchAll(query: any) {
  const all: any[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await query.range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reportId = searchParams.get('report_id') || ''

  let q = supabase
    .from('hitech_report_hitechsupervisor')
    .select('id, report_id, party, supervisor_name, supervisor_missing_name, subcontractor_name, employee_profile_id')
    .order('id', { ascending: false })

  if (reportId) q = (q as any).eq('report_id', parseInt(reportId))

  const data = await fetchAll(q)
  return respond(req, data)
}
