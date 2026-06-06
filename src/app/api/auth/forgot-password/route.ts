import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL    || 'https://hitech.datatodecisions.org'
const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME    || 'PORTAL'
const APP_COMPANY = process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd'
const EMAIL_FROM  = process.env.RESEND_FROM_EMAIL       || `noreply@hitech.datatodecisions.org`

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('auth_user')
    .select('id, email, first_name')
    .ilike('email', email.trim())
    .single()

  // Always return success to prevent user enumeration
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

  // Invalidate any existing tokens for this user
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('user_id', user.id)
    .eq('used', false)

  await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  })

  const resetLink = `${SITE_URL}/reset-password?token=${token}`
  const name = user.first_name || 'there'

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `${APP_NAME} Portal <${EMAIL_FROM}>`,
      to: user.email,
      subject: `Reset your ${APP_NAME} Portal password`,
      html: `
        <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#1a1208;color:#f2ede3;border-radius:12px;">
          <div style="font-size:1.4rem;font-weight:800;color:#f2b950;margin-bottom:4px;letter-spacing:-0.02em;">${APP_NAME}</div>
          <div style="font-size:0.65rem;letter-spacing:0.18em;color:#8c7a58;text-transform:uppercase;margin-bottom:28px;">${APP_COMPANY} — Portal</div>
          <p style="color:#f2ede3;font-size:0.92rem;margin-bottom:16px;">Hi ${name},</p>
          <p style="color:#f2ede3;font-size:0.92rem;margin-bottom:24px;">A password reset was requested for your account. Click the button below to set a new password. This link expires in <strong style="color:#f2b950;">1 hour</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;padding:13px 28px;background:#f2b950;color:#1a1208;font-weight:800;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;border-radius:9px;text-decoration:none;">Reset Password →</a>
          <p style="color:#8c7a58;font-size:0.75rem;margin-top:28px;">If you didn't request this, ignore this email — your password won't change.</p>
          <hr style="border:none;border-top:1px solid rgba(242,185,80,0.15);margin:24px 0;" />
          <p style="color:#8c7a58;font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;">${APP_COMPANY}</p>
        </div>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}
