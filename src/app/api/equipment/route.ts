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

  const { data, error } = await supabase
    .from('surveycollection_planningtable')
    .select('*')
    .order('fleet_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await requireSession(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const body = await req.json()
  const { fleet_number, machine_type, machine_belonging, health_status, project_name, section_name, assigned_to } = body

  const resolvedStatus = assigned_to ? 'deployed_to_site' : 'in_store'

  const { data, error } = await supabase
    .from('surveycollection_planningtable')
    .insert({ fleet_number, machine_type, machine_belonging, deployment_status: resolvedStatus, health_status, project_name, section_name, assigned_to: assigned_to || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
