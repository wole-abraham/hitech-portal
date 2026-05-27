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

  const { searchParams } = new URL(req.url)
  const project  = searchParams.get('project')
  const section  = searchParams.get('section') ?? ''
  const chainage = searchParams.get('chainage')
  const item     = searchParams.get('item')
  const side     = searchParams.get('side') ?? ''

  if (!project || !chainage || !item) {
    return NextResponse.json({ component: null })
  }

  let query = supabase
    .from('hitech_report_component')
    .select('*')
    .ilike('project_name', project)   // case-insensitive — "Coastal Road" matches "Coastal road"
    .ilike('chainage', chainage)
    .ilike('item', item)
    .limit(1)

  if (section) query = query.ilike('section_name', section)
  if (side)    query = query.ilike('side', side)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ component: data?.[0] ?? null })
}
