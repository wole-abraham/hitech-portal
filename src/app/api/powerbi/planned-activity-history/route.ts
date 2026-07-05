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
  const planId   = searchParams.get('plan_id')  || ''
  const project  = searchParams.get('project')  || ''
  const dateFrom = searchParams.get('date_from')|| ''
  const dateTo   = searchParams.get('date_to')  || ''

  let q = supabase
    .from('hitech_plan_activity_history')
    .select('id, plan_id, plan_title, project_name, section_name, activity_category, activity_type, activity_subtype, side, activity_status, start_chainage, end_chainage, weather, party_for_activity, not_conforming, car_used, changed_by, changed_at')
    .order('changed_at', { ascending: false })

  if (planId) {
    const pid = parseInt(planId)
    if (isNaN(pid)) return err('Invalid plan_id', 400)
    q = (q as any).eq('plan_id', pid)
  }
  if (project)  q = (q as any).ilike('project_name', `%${project}%`)
  if (dateFrom) q = (q as any).gte('changed_at', dateFrom)
  if (dateTo)   q = (q as any).lte('changed_at', dateTo)

  const { data, error } = await fetchAll(q)
  if (error) return err(error.message)
  return respond(req, data)
}
