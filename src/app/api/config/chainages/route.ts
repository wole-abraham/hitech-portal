import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAdmin(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user || session.user.role !== 'admin') return null
  return session.user
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const projectId = searchParams.get('project_id')

  let q = supabase
    .from('hitech_report_chainage')
    .select('*')
    .order('name', { ascending: true })

  if (projectId) q = (q as any).eq('project_id', Number(projectId))

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Bulk insert
  if (Array.isArray(body.items)) {
    const rows = body.items.map((r: any) => ({
      project_id:   Number(r.project_id),
      chainage:     r.chainage?.trim() || '',
      name:         r.name?.trim() || r.chainage?.trim() || '',
      label:        r.label?.trim() || null,
      section_name: r.section_name?.trim() || null,
      latitude:     r.latitude != null ? Number(r.latitude) : null,
      longitude:    r.longitude != null ? Number(r.longitude) : null,
    })).filter((r: any) => r.project_id && r.chainage)

    const { data, error } = await supabase.from('hitech_report_chainage').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data })
  }

  // Single insert
  if (!body.project_id || !body.chainage?.trim())
    return NextResponse.json({ error: 'project_id and chainage are required' }, { status: 400 })

  const { data, error } = await supabase
    .from('hitech_report_chainage')
    .insert({
      project_id:   Number(body.project_id),
      chainage:     body.chainage.trim(),
      name:         body.name?.trim() || body.chainage.trim(),
      label:        body.label?.trim() || null,
      section_name: body.section_name?.trim() || null,
      latitude:     body.latitude != null ? Number(body.latitude) : null,
      longitude:    body.longitude != null ? Number(body.longitude) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('hitech_report_chainage')
    .update({
      project_id:   body.project_id != null ? Number(body.project_id) : undefined,
      chainage:     body.chainage?.trim(),
      name:         body.name?.trim() || body.chainage?.trim(),
      label:        body.label?.trim() || null,
      section_name: body.section_name?.trim() || null,
      latitude:     body.latitude != null ? Number(body.latitude) : null,
      longitude:    body.longitude != null ? Number(body.longitude) : null,
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('hitech_report_chainage').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
