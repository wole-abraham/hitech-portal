import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLE_MAP: Record<string, { table: string; order: string | null }> = {
  teamcars:       { table: 'hitech_report_teamcar',           order: 'order' },
  subcontractors: { table: 'hitech_report_subcontractorname', order: 'order' },
  categories:     { table: 'hitech_report_activitycategory',  order: 'order' },
  types:          { table: 'hitech_report_activitytype',      order: 'order' },
  subtypes:       { table: 'hitech_report_activitysubtype',   order: 'order' },
  projects:       { table: 'surveycollection_project',        order: 'name'  },
  sections:       { table: 'surveycollection_section',        order: 'name'  },
  supervisors:    { table: 'hitech_report_sitesupervisor',   order: 'order' },
  engineers:      { table: 'hitech_report_siteengineer',     order: 'order' },
  machinerytypes: { table: 'hitech_report_machinerytype',    order: 'order' },
}

async function requireAdmin(req: NextRequest): Promise<AppSession['user'] | null> {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user || session.user.role !== 'admin') return null
  return session.user
}

// ── GET ─────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { resource } = await params

  if (resource === 'login-history') {
    const { data: rows, error } = await supabase
      .from('login_history')
      .select('id, user_id, signed_in_at, auth_user!inner(first_name, last_name, email, username)')
      .order('signed_in_at', { ascending: false })
      .limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const items = (rows ?? []).map((r: any) => ({
      id:           r.id,
      user_id:      r.user_id,
      signed_in_at: r.signed_in_at,
      name:  (r.auth_user?.first_name || r.auth_user?.last_name)
               ? `${r.auth_user.first_name} ${r.auth_user.last_name}`.trim()
               : r.auth_user?.username ?? '—',
      email: r.auth_user?.email ?? '—',
    }))
    return NextResponse.json({ items })
  }

  if (resource === 'users') {
    const { data: users, error } = await supabase
      .from('auth_user')
      .select('id, first_name, last_name, email, username, is_active, is_staff, date_joined')
      .order('date_joined', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: employees } = await supabase
      .from('surveycollection_employee')
      .select('user_id, role, status')
    const empMap = Object.fromEntries((employees ?? []).map(e => [e.user_id, e]))

    const items = (users ?? []).map(u => ({
      ...u,
      role:   empMap[u.id]?.role   ?? (u.is_staff ? 'Admin' : 'Worker'),
      status: empMap[u.id]?.status ?? (u.is_active ? 'Active' : 'Inactive'),
    }))
    return NextResponse.json({ items })
  }

  const cfg = TABLE_MAP[resource]
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })

  let q = supabase.from(cfg.table).select('*')
  if (cfg.order) q = (q as any).order(cfg.order)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// ── POST ────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { resource } = await params

  const cfg = TABLE_MAP[resource]
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })

  const body = await req.json()
  const { data, error } = await supabase.from(cfg.table).insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// ── PATCH ───────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { resource } = await params

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (resource === 'users') {
    if ('is_staff' in updates) {
      const { error } = await supabase.from('auth_user')
        .update({ is_staff: updates.is_staff })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    const { error } = await supabase.from('auth_user')
      .update({ is_active: updates.is_active })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('surveycollection_employee')
      .update({ status: updates.is_active ? 'Active' : 'Inactive' })
      .eq('user_id', id)
    return NextResponse.json({ ok: true })
  }

  const cfg = TABLE_MAP[resource]
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })

  const { data, error } = await supabase.from(cfg.table).update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// ── DELETE ──────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { resource } = await params

  const cfg = TABLE_MAP[resource]
  if (!cfg) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from(cfg.table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
