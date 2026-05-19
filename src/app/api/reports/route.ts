import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search   = searchParams.get('search') || ''
  const project  = searchParams.get('project') || ''
  const category = searchParams.get('category') || ''
  const page     = parseInt(searchParams.get('page') || '0')

  let query = supabase
    .from('hitech_report_hitechreport')
    .select('*', { count: 'exact' })
    .order('date_of_activity', { ascending: false })
    .order('id', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  if (search) {
    query = query.or(
      `reporter_name.ilike.%${search}%,project_name.ilike.%${search}%,activity_type.ilike.%${search}%`
    )
  }
  if (project)  query = query.eq('project_name', project)
  if (category) query = query.eq('activity_category', category)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data ?? [], total: count ?? 0 })
}
