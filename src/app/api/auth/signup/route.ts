import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'
import { Resend } from 'resend'

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL    || 'https://hitech.datatodecisions.org'
const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME    || 'PORTAL'
const APP_COMPANY = process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd'
const EMAIL_FROM  = process.env.RESEND_FROM_EMAIL       || `noreply@hitech.datatodecisions.org`

const pbkdf2Async = promisify(pbkdf2)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function makeDjangoPassword(password: string): Promise<string> {
  const iterations = 600000
  const salt = randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 22)
  const hash = await pbkdf2Async(password, salt, iterations, 32, 'sha256')
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('base64')}`
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Self-registration is disabled. Contact your administrator to create an account.' },
    { status: 403 }
  )
}

export async function POST_DISABLED(req: NextRequest) {
  const { first_name, last_name, email, phone, password, jobRole, dob, gender, nationality } = await req.json()

  const ALLOWED_ROLES = ['Engineer','Supervisor','Operator','Technician','Labourer','Driver','Surveyor','Site Manager','Other']

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: 'First name and last name are required.' }, { status: 400 })
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }
  if (!jobRole || !ALLOWED_ROLES.includes(jobRole)) {
    return NextResponse.json({ error: 'Please select a valid job role.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('auth_user')
    .select('id')
    .ilike('email', email)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
  }

  const encoded = await makeDjangoPassword(password)
  const now = new Date().toISOString()
  // Django requires a unique username — use email since we no longer expose username
  const username = email.toLowerCase()
  const fullName = `${first_name.trim()} ${last_name.trim()}`

  const { data: newUser, error } = await supabase.from('auth_user').insert({
    username,
    email,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    password: encoded,
    is_staff: false,
    is_superuser: false,
    is_active: false,
    date_joined: now,
    last_login: now,
  }).select('id').single()

  if (error || !newUser) {
    return NextResponse.json({ error: error?.message ?? 'Could not create account.' }, { status: 500 })
  }

  const { error: empError } = await supabase.from('surveycollection_employee').insert({
    name: fullName,
    email,
    role: jobRole,
    status: 'Active',
    user_id: newUser.id,
    phone_number: phone || '',
    project_name: '',
    section_name: '',
    notes: '',
    date_added: new Date().toISOString().slice(0, 10),
    profile_picture: '',
    date_of_birth: dob || null,
    gender: gender || null,
    nationality: nationality || null,
  })

  if (empError) {
    console.error('Employee insert failed:', empError.message)
  }

  // Generate verification token (24-hour expiry)
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('email_verification_tokens').insert({
    user_id: newUser.id, token, expires_at: expiresAt,
  })

  const verifyLink = `${SITE_URL}/verify-email?token=${token}`
  const name = first_name.trim()

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `${APP_NAME} Portal <${EMAIL_FROM}>`,
      to: email,
      subject: `Verify your ${APP_NAME} Portal account`,
      html: `
        <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#1a1208;color:#f2ede3;border-radius:12px;">
          <div style="font-size:1.4rem;font-weight:800;color:#f2b950;margin-bottom:4px;letter-spacing:-0.02em;">${APP_NAME}</div>
          <div style="font-size:0.65rem;letter-spacing:0.18em;color:#8c7a58;text-transform:uppercase;margin-bottom:28px;">${APP_COMPANY} — Portal</div>
          <p style="color:#f2ede3;font-size:0.92rem;margin-bottom:16px;">Hi ${name},</p>
          <p style="color:#f2ede3;font-size:0.92rem;margin-bottom:24px;">Welcome to ${APP_NAME} Portal. Click the button below to verify your email address and activate your account. This link expires in <strong style="color:#f2b950;">24 hours</strong>.</p>
          <a href="${verifyLink}" style="display:inline-block;padding:13px 28px;background:#f2b950;color:#1a1208;font-weight:800;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;border-radius:9px;text-decoration:none;">Verify Email →</a>
          <p style="color:#8c7a58;font-size:0.75rem;margin-top:28px;">If you didn't sign up for ${APP_NAME} Portal, you can ignore this email.</p>
          <hr style="border:none;border-top:1px solid rgba(242,185,80,0.15);margin:24px 0;" />
          <p style="color:#8c7a58;font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;">${APP_COMPANY}</p>
        </div>
      `,
    })
  }

  return NextResponse.json({ ok: true, pending: true })
}
