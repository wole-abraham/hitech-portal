import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireSession(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  return session.user ?? null
}

export async function GET(req: NextRequest) {
  const user = await requireSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const excludeAdmins = searchParams.get('excludeAdmins') === 'true'

  let q = supabase
    .from('surveycollection_employee')
    .select('id, name, role, status, phone_number, project_name, section_name, email, notes, user_id, profile_picture')
    .order('name')

  if (status) q = (q as any).eq('status', status)

  if (excludeAdmins) {
    const { data: admins } = await supabase
      .from('auth_user')
      .select('id')
      .eq('is_staff', true)
    const adminIds = (admins ?? []).map((a: { id: number }) => a.id)
    if (adminIds.length > 0) q = (q as any).not('user_id', 'in', `(${adminIds.join(',')})`)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await requireSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const { name, role, phone_number, project_name, section_name, status, email, notes, profile_picture } = body

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .insert({ name, role, phone_number, project_name, section_name, status, email, notes, profile_picture: profile_picture || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
