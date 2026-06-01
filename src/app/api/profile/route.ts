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

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .select('id, name, role, status, phone_number, email, project_name, section_name, notes, profile_picture, passport_photo, passport_document, fingerprint_id, date_of_birth, nationality, gender, date_added')
    .eq('user_id', session.user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: emp } = await supabase
    .from('surveycollection_employee')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (!emp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const { phone_number, nationality, gender, date_of_birth, notes, profile_picture, fingerprint_id } = body

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .update({
      phone_number: phone_number ?? null,
      nationality:  nationality  || null,
      gender:       gender       || null,
      date_of_birth: date_of_birth || null,
      notes:        notes        ?? null,
      ...(profile_picture !== undefined && { profile_picture: profile_picture || null }),
      ...(fingerprint_id  !== undefined && { fingerprint_id:  fingerprint_id  || null }),
    })
    .eq('id', emp.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
