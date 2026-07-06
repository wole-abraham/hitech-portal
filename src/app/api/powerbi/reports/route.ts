import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { respond, options } from '../_auth'

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
  const project  = searchParams.get('project')   || ''
  const category = searchParams.get('category')  || ''
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo   = searchParams.get('date_to')   || ''

  let q = supabase
    .from('hitech_report_hitechreport')
    .select('id, date_of_activity, submitted_at, planned_activity_id, project_name, section_name, activity_category, activity_type, activity_status, weather, reporter_name, start_chainage, end_chainage, start_chainage_val, end_chainage_val, comment_activity, custom_data')
    .order('date_of_activity', { ascending: false })

  if (project)  q = (q as any).ilike('project_name', `%${project}%`)
  if (category) q = (q as any).ilike('activity_category', `%${category}%`)
  if (dateFrom) q = (q as any).gte('date_of_activity', dateFrom)
  if (dateTo)   q = (q as any).lte('date_of_activity', dateTo)

  const raw = await fetchAll(q)

  // Fetch linked planned activities to get planned dates
  const planIds = [...new Set(raw.map((r: any) => r.planned_activity_id).filter(Boolean))]
  const planMap: Record<number, { scheduled_date: string | null; activity_status: string | null }> = {}
  if (planIds.length > 0) {
    const { data: plans } = await supabase
      .from('hitech_report_plannedactivity')
      .select('id, custom_data, activity_status')
      .in('id', planIds)
    ;(plans ?? []).forEach((p: any) => {
      planMap[p.id] = { scheduled_date: p.custom_data?.scheduled_date ?? null, activity_status: p.activity_status ?? null }
    })
  }

  const data = raw.map((r: any) => {
    const cd = r.custom_data || {}
    const plan = r.planned_activity_id ? (planMap[r.planned_activity_id] ?? null) : null
    return {
      id:                      r.id,
      date_of_planning:        plan?.scheduled_date ?? null,
      date_of_implementation:  r.date_of_activity,
      submitted_at:            r.submitted_at,
      planning_status:         r.planned_activity_id ? 'Planned' : 'Newly Planned',
      activity_status:         r.activity_status,
      planned_activity_status: plan?.activity_status ?? null,
      project_name:            r.project_name,
      section_name:            r.section_name,
      activity_category:       r.activity_category,
      activity_type:           r.activity_type,
      weather:                 r.weather,
      reporter_name:           r.reporter_name,
      start_chainage:          r.start_chainage,
      end_chainage:            r.end_chainage,
      start_chainage_val:      r.start_chainage_val,
      end_chainage_val:        r.end_chainage_val,
      planned_start_chainage:  cd.planned_start_chainage ?? null,
      planned_end_chainage:    cd.planned_end_chainage   ?? null,
      comment_activity:        r.comment_activity,
    }
  })

  return respond(req, data)
}
