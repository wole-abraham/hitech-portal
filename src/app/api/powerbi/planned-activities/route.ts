import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project    = searchParams.get('project')
  const section    = searchParams.get('section')
  const status     = searchParams.get('status')
  const dateFrom   = searchParams.get('date_from')
  const dateTo     = searchParams.get('date_to')
  const fmt        = searchParams.get('format')

  // Fetch all planned activities
  let q = supabase
    .from('hitech_report_plannedactivity')
    .select('*')
    .order('created_at', { ascending: false })

  if (project) q = q.eq('project_name', project)
  if (section) q = q.eq('section_name', section)
  if (status)  q = q.eq('activity_status', status)

  const { data: plans, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })

  // Fetch report counts + earliest/latest report date per plan
  const ids = (plans ?? []).map((p: any) => p.id)
  const implMap: Record<number, { count: number; first_report_date: string | null; last_report_date: string | null }> = {}

  if (ids.length > 0) {
    const { data: reports } = await supabase
      .from('hitech_report_hitechreport')
      .select('planned_activity_id, submitted_at')
      .in('planned_activity_id', ids)
      .order('submitted_at', { ascending: true })

    ;(reports ?? []).forEach((r: any) => {
      const pid = r.planned_activity_id
      if (!implMap[pid]) implMap[pid] = { count: 0, first_report_date: null, last_report_date: null }
      implMap[pid].count++
      if (!implMap[pid].first_report_date) implMap[pid].first_report_date = r.submitted_at
      implMap[pid].last_report_date = r.submitted_at
    })
  }

  let data = (plans ?? []).map((p: any) => {
    const impl = implMap[p.id] ?? { count: 0, first_report_date: null, last_report_date: null }
    return {
      id:                          p.id,
      title:                       p.title,
      project_name:                p.project_name,
      section_name:                p.section_name,
      activity_category:           p.activity_category,
      activity_type:               p.activity_type,
      activity_subtype:            p.activity_subtype,
      side:                        p.side,
      weather:                     p.weather,
      start_chainage:              p.start_chainage,
      end_chainage:                p.end_chainage,
      activity_status:             p.activity_status,
      party_for_activity:          p.party_for_activity,
      not_conforming:              p.not_conforming,
      car_used:                    p.car_used,
      planned_date:                p.custom_data?.scheduled_date ?? null,
      created_by:                  p.created_by,
      is_active:                   p.is_active,
      created_at:                  p.created_at,
      report_count:                impl.count,
      implementation_date:         impl.first_report_date,
      last_report_date:            impl.last_report_date,
      report_status:               impl.count > 0 ? 'reported' : 'pending',
    }
  })

  // Date filter on planned_date
  if (dateFrom) data = data.filter((r: any) => r.planned_date && r.planned_date >= dateFrom)
  if (dateTo)   data = data.filter((r: any) => r.planned_date && r.planned_date <= dateTo)

  if (fmt === 'csv') {
    const cols = ['id','title','project_name','section_name','activity_category','activity_type','activity_subtype','side','weather','start_chainage','end_chainage','activity_status','party_for_activity','not_conforming','car_used','planned_date','created_by','is_active','created_at','report_count','implementation_date','last_report_date','report_status']
    const csv = [
      cols.join(','),
      ...data.map((r: any) => cols.map(c => JSON.stringify(r[c] ?? '')).join(','))
    ].join('\n')
    return new NextResponse(csv, { status: 200, headers: { ...CORS, 'Content-Type': 'text/csv' } })
  }

  return NextResponse.json({ count: data.length, data }, { headers: CORS })
}
