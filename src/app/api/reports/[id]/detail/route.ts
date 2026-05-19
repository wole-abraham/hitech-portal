import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await params
  const id = parseInt(rawId)
  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const [
    { data: photos },
    { data: employees },
    { data: supervisors },
    { data: engineers },
    { data: machines },
  ] = await Promise.all([
    supabase.from('hitech_report_hitechphoto').select('file,media_type').eq('report_id', id).order('id'),
    supabase.from('hitech_report_hitechemployee').select('employee_name,employee_role,employee_missing_name').eq('report_id', id),
    supabase.from('hitech_report_hitechsupervisor').select('supervisor_name,party,subcontractor_name,supervisor_missing_name').eq('report_id', id),
    supabase.from('hitech_report_hitechengineer').select('engineer_name,party,subcontractor_name,engineer_missing_name').eq('report_id', id),
    supabase.from('hitech_report_hitechmachine').select('ownership,machine_name,plate_number,driver_name,fleet_number').eq('report_id', id),
  ])

  return NextResponse.json({
    photos:      photos      ?? [],
    employees:   employees   ?? [],
    supervisors: supervisors ?? [],
    engineers:   engineers   ?? [],
    machines:    machines    ?? [],
  })
}
