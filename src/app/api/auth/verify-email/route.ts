import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 })
  }

  const { data: record } = await supabase
    .from('email_verification_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .single()

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 })
  }
  if (record.used) {
    return NextResponse.json({ error: 'This link has already been used.' }, { status: 400 })
  }
  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired. Please sign up again.' }, { status: 400 })
  }

  await Promise.all([
    supabase.from('auth_user').update({ is_active: true }).eq('id', record.user_id),
    supabase.from('email_verification_tokens').update({ used: true }).eq('id', record.id),
  ])

  return NextResponse.json({ ok: true })
}
