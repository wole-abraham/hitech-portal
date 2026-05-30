import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkApiKey } from '../_auth'

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

export async function GET(req: NextRequest) {
  const deny = checkApiKey(req)
  if (deny) return deny

  const { searchParams } = new URL(req.url)
  const project  = searchParams.get('project')   || ''
  const category = searchParams.get('category')  || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo   = searchParams.get('date_to')   || ''

  let q = supabase
    .from('hitech_report_hitechreport')
    .select('id, date_of_activity, project_name, section_name, activity_category, activity_type, activity_status, weather, reporter_name, start_chainage, end_chainage, start_chainage_val, end_chainage_val, comment_activity')
    .order('date_of_activity', { ascending: false })

  if (project)  q = (q as any).ilike('project_name', `%${project}%`)
  if (category) q = (q as any).ilike('activity_category', `%${category}%`)
  if (dateFrom) q = (q as any).gte('date_of_activity', dateFrom)
  if (dateTo)   q = (q as any).lte('date_of_activity', dateTo)

  const data = await fetchAll(q)
  return NextResponse.json(data)
}
