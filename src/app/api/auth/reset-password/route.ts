import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'

const pbkdf2Async = promisify(pbkdf2)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function makeDjangoPassword(password: string): Promise<string> {
  const iterations = 870000
  const salt = randomBytes(12).toString('base64url').slice(0, 12)
  const derived = await pbkdf2Async(password, salt, iterations, 32, 'sha256')
  return `pbkdf2_sha256$${iterations}$${salt}$${derived.toString('base64')}`
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .single()

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  if (record.used) {
    return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 })
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
  }

  const encoded = await makeDjangoPassword(password)

  await Promise.all([
    supabase.from('auth_user').update({ password: encoded }).eq('id', record.user_id),
    supabase.from('password_reset_tokens').update({ used: true }).eq('id', record.id),
  ])

  return NextResponse.json({ ok: true })
}
