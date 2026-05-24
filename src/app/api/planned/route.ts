import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSession(req: NextRequest) {
  const res = NextResponse.json({})
  return getIronSession<AppSession>(req, res, sessionOptions)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const showAll = new URL(req.url).searchParams.get('all') === 'true' && session.user.role === 'admin'

  let q = supabase
    .from('hitech_report_plannedactivity')
    .select('*')
    .order('created_at', { ascending: false })

  if (!showAll) q = (q as any).eq('is_active', true)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('hitech_report_plannedactivity')
    .insert({
      title:             body.title.trim(),
      description:       body.description || null,
      project_name:      body.project_name || null,
      section_name:      body.section_name || null,
      activity_category: body.activity_category || null,
      activity_type:     body.activity_type || null,
      activity_subtype:  body.activity_subtype || null,
      side:              body.side || null,
      weather:           body.weather || null,
      start_chainage:    body.start_chainage || null,
      end_chainage:      body.end_chainage || null,
      is_active:         true,
      created_by:        session.user.username || `${session.user.first_name} ${session.user.last_name}`.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('hitech_report_plannedactivity')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session.user || session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('hitech_report_plannedactivity')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
