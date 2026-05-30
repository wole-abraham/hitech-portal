import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { id: rawId } = await params
  const id = parseInt(rawId)
  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const body = await req.json()
  const { name, role, phone_number, project_name, section_name, status, email, notes, profile_picture, passport_photo, passport_document, fingerprint_id } = body

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .update({
      name, role, phone_number, project_name, section_name, status, email, notes,
      ...(profile_picture  !== undefined && { profile_picture:  profile_picture  || null }),
      ...(passport_photo   !== undefined && { passport_photo:   passport_photo   || null }),
      ...(passport_document !== undefined && { passport_document: passport_document || null }),
      ...(fingerprint_id  !== undefined && { fingerprint_id:  fingerprint_id  || null }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)

  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId)
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // Grab linked user_id before deleting the employee row
  const { data: empRow } = await supabase
    .from('surveycollection_employee')
    .select('user_id')
    .eq('id', id)
    .single()

  // Null out FK references before deleting (FK is RESTRICT in DB, not SET NULL)
  await supabase.from('hitech_report_hitechemployee').update({ employee_profile_id: null }).eq('employee_profile_id', id)
  await supabase.from('hitech_report_hitechsupervisor').update({ employee_profile_id: null }).eq('employee_profile_id', id)
  await supabase.from('hitech_report_hitechengineer').update({ employee_profile_id: null }).eq('employee_profile_id', id)

  const { error } = await supabase
    .from('surveycollection_employee')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Delete the linked auth account so they can no longer log in
  if (empRow?.user_id) {
    await supabase.from('auth_user').delete().eq('id', empRow.user_id)
  }

  return NextResponse.json({ ok: true })
}
