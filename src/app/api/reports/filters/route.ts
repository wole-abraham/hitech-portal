import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: pData }, { data: cData }] = await Promise.all([
    supabase.from('hitech_report_hitechreport').select('project_name').order('project_name'),
    supabase.from('hitech_report_hitechreport').select('activity_category').order('activity_category'),
  ])

  const projects   = [...new Set<string>((pData ?? []).map((r: any) => r.project_name).filter(Boolean))]
  const categories = [...new Set<string>((cData ?? []).map((r: any) => r.activity_category).filter(Boolean))]

  return NextResponse.json({ projects, categories })
}
