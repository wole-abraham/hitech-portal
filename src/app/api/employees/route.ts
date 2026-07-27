import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'
import { pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'
import { Resend } from 'resend'

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL    || 'https://hitech.datatodecisions.org'
const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME    || 'PORTAL'
const APP_COMPANY = process.env.NEXT_PUBLIC_APP_COMPANY || 'Hitech Construction Ltd'
const EMAIL_FROM  = process.env.RESEND_FROM_EMAIL       || 'noreply@hitech.datatodecisions.org'

const pbkdf2Async = promisify(pbkdf2)

async function makePassword(password: string): Promise<string> {
  const iterations = 600000
  const salt = randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 22)
  const hash = await pbkdf2Async(password, salt, iterations, 32, 'sha256')
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('base64')}`
}

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
    .select('id, name, role, status, phone_number, project_name, section_name, email, notes, user_id, profile_picture, passport_photo, passport_document, fingerprint_id, fingerprint_template, date_of_birth, marital_status, nationality, gender')
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
  const { name, role, phone_number, project_name, section_name, status, email, notes, profile_picture, passport_photo, passport_document, fingerprint_id, date_of_birth, nationality, gender } = body

  if (!name?.trim())     return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  if (!role?.trim())     return NextResponse.json({ error: 'Role is required.' }, { status: 400 })
  if (!email?.trim())    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  if (!phone_number?.trim()) return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
  if (!project_name?.trim()) return NextResponse.json({ error: 'Project is required.' }, { status: 400 })

  // Check if auth account already exists for this email
  const { data: existing } = await supabase
    .from('auth_user')
    .select('id')
    .ilike('email', email.trim())
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
  }

  // Auto-create auth account — employee will use forgot-password to set their own password
  const nameParts = name.trim().split(' ')
  const firstName = nameParts[0]
  const lastName  = nameParts.slice(1).join(' ') || '—'
  const tempPassword = await makePassword(randomBytes(24).toString('hex'))
  const now = new Date().toISOString()

  const { data: newUser, error: authError } = await supabase
    .from('auth_user')
    .insert({
      username:     email.toLowerCase().trim(),
      email:        email.trim(),
      first_name:   firstName,
      last_name:    lastName,
      password:     tempPassword,
      is_staff:     false,
      is_superuser: false,
      is_active:    true,
      date_joined:  now,
      last_login:   now,
    })
    .select('id')
    .single()

  if (authError || !newUser) {
    return NextResponse.json({ error: authError?.message ?? 'Could not create account.' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .insert({
      name, role, phone_number, project_name, section_name,
      status: status || 'Active', email, notes,
      profile_picture:   profile_picture   || null,
      passport_photo:    passport_photo    || null,
      passport_document: passport_document || null,
      fingerprint_id:    fingerprint_id    || null,
      date_added:        new Date().toISOString().split('T')[0],
      date_of_birth:     date_of_birth     || null,
      nationality:       nationality       || null,
      gender:            gender            || null,
      user_id:           newUser.id,
    })
    .select()
    .single()

  if (error) {
    // Roll back the auth user if employee insert fails
    await supabase.from('auth_user').delete().eq('id', newUser.id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send welcome email — employee sets their own password via forgot-password
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here') {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const forgotLink = `${SITE_URL}/forgot-password`
      await resend.emails.send({
        from: `${APP_NAME} Portal <${EMAIL_FROM}>`,
        to: email.trim(),
        subject: `Your ${APP_NAME} Portal account is ready`,
        html: `
          <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#1a1208;color:#f2ede3;border-radius:12px;">
            <div style="font-size:1.4rem;font-weight:800;color:#f2b950;margin-bottom:4px;letter-spacing:-0.02em;">${APP_NAME}</div>
            <div style="font-size:0.65rem;letter-spacing:0.18em;color:#8c7a58;text-transform:uppercase;margin-bottom:28px;">${APP_COMPANY} — Field Operations Portal</div>
            <p style="color:#f2ede3;font-size:0.92rem;margin-bottom:8px;">Hi ${firstName},</p>
            <p style="color:#f2ede3;font-size:0.92rem;margin-bottom:24px;">
              Your account has been created on the <strong style="color:#f2b950;">${APP_NAME} Portal</strong>.
              To log in for the first time, you need to set your password using the link below.
            </p>
            <div style="background:rgba(242,185,80,0.08);border:1px solid rgba(242,185,80,0.20);border-radius:9px;padding:16px;margin-bottom:24px;">
              <div style="font-size:0.7rem;color:#8c7a58;text-transform:uppercase;letter-spacing:0.10em;margin-bottom:6px;">Your login email</div>
              <div style="font-size:0.95rem;font-weight:700;color:#f2b950;">${email.trim()}</div>
            </div>
            <a href="${forgotLink}" style="display:inline-block;padding:13px 28px;background:#f2b950;color:#1a1208;font-weight:800;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;border-radius:9px;text-decoration:none;">Set My Password →</a>
            <p style="color:#8c7a58;font-size:0.75rem;margin-top:28px;line-height:1.55;">
              Click the button above, enter your email address, and follow the link in the reset email to create your password. Then log in at <a href="${SITE_URL}/login" style="color:#f2b950;">${SITE_URL}/login</a>.
            </p>
            <hr style="border:none;border-top:1px solid rgba(242,185,80,0.15);margin:24px 0;" />
            <p style="color:#8c7a58;font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;">${APP_COMPANY}</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
      // Don't fail the whole request if email fails
    }
  }

  return NextResponse.json(data, { status: 201 })
}
