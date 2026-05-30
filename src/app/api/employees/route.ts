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
    .select('id, name, role, status, phone_number, project_name, section_name, email, notes, user_id, profile_picture, passport_photo, passport_document, fingerprint_id, date_of_birth, marital_status, nationality, gender')
    .order('name')

  if (status) q = (q as any).eq('status', status)

  if (excludeAdmins) {
    const { data: admins } = await supabase
      .from('auth_user')
      .select('id')
      .eq('is_staff', true)
    const adminIds = (admins ?? []).map((a: { id: number }) => a.id)
    if (adminIds.length > 0) {
      // NULL user_id rows are excluded by NOT IN — explicitly keep them
      q = (q as any).or(`user_id.is.null,user_id.not.in.(${adminIds.join(',')})`)
    }
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const employees = data ?? []
  const linkedIds = employees.map((e: { user_id: number | null }) => e.user_id).filter(Boolean) as number[]
  let adminSet = new Set<number>()
  if (linkedIds.length > 0) {
    const { data: admins } = await supabase
      .from('auth_user')
      .select('id')
      .eq('is_staff', true)
      .in('id', linkedIds)
    adminSet = new Set((admins ?? []).map((a: { id: number }) => a.id))
  }

  return NextResponse.json(employees.map((e: { user_id: number | null }) => ({ ...e, is_admin: e.user_id != null && adminSet.has(e.user_id) })))
}

export async function POST(req: NextRequest) {
  const user = await requireSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const { name, role, phone_number, project_name, section_name, status, email, notes, profile_picture, passport_photo, passport_document, fingerprint_id, date_of_birth, marital_status, nationality, gender } = body

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .insert({ name, role: role || '', phone_number, project_name, section_name, status: status || 'Active', email, notes, profile_picture: profile_picture || null, passport_photo: passport_photo || null, passport_document: passport_document || null, fingerprint_id: fingerprint_id || null, date_added: new Date().toISOString().split('T')[0], date_of_birth: date_of_birth || null, marital_status: marital_status || null, nationality: nationality || null, gender: gender || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
