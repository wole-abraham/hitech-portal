import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'
import { sessionOptions, AppSession } from '@/lib/session'

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

export async function POST(req: NextRequest) {
  const { first_name, last_name, email, password, jobRole } = await req.json()

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
    is_active: true,
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
    phone_number: '',
    project_name: '',
    section_name: '',
    notes: '',
    date_added: new Date().toISOString().slice(0, 10),
    profile_picture: '',
  })

  if (empError) {
    console.error('Employee insert failed:', empError.message)
  }

  const res = NextResponse.json({ ok: true })
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  session.user = {
    id: newUser.id,
    username,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email,
    is_staff: false,
    is_superuser: false,
    role: 'worker',
  }
  await session.save()

  return res
}
