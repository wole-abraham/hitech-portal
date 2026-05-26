import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSession(req: NextRequest) {
  const res = NextResponse.json({})
  return getIronSession<AppSession>(req, res, sessionOptions)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [{ data: item, error }, { data: employees }, { data: supervisors }, { data: machines }] =
    await Promise.all([
      supabase.from('hitech_report_plannedactivity').select('*').eq('id', id).single(),
      supabase.from('hitech_plan_employee').select('*').eq('plan_id', id).order('id'),
      supabase.from('hitech_plan_supervisor').select('*').eq('plan_id', id).order('id'),
      supabase.from('hitech_plan_machine').select('*').eq('plan_id', id).order('id'),
    ])

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({
    item,
    employees:   employees  ?? [],
    supervisors: supervisors ?? [],
    machines:    machines   ?? [],
  })
}
