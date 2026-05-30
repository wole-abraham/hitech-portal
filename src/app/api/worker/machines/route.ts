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

  // 1. Primary: find by user_id
  let { data: employees } = await supabase
    .from('surveycollection_employee')
    .select('id, name, role')
    .eq('user_id', session.user.id)
    .limit(1)

  // 2. Email fallback: unlinked or already linked to this user
  if ((!employees || employees.length === 0) && session.user.email) {
    const { data: byEmail } = await supabase
      .from('surveycollection_employee')
      .select('id, name, role, user_id')
      .ilike('email', session.user.email)
      .or(`user_id.is.null,user_id.eq.${session.user.id}`)
      .limit(1)

    if (byEmail && byEmail.length > 0) {
      await supabase
        .from('surveycollection_employee')
        .update({ user_id: session.user.id })
        .eq('id', byEmail[0].id)
      employees = byEmail
    }
  }

  // 3. Auto-create: no employee record exists yet — create one from session data
  if (!employees || employees.length === 0) {
    const fullName = [session.user.first_name, session.user.last_name].filter(Boolean).join(' ') || session.user.email
    const { data: created } = await supabase
      .from('surveycollection_employee')
      .insert({
        name: fullName,
        email: session.user.email,
        role: 'Field Worker',
        status: 'Active',
        user_id: session.user.id,
        phone_number: '',
        project_name: '',
        section_name: '',
        notes: '',
        date_added: new Date().toISOString().slice(0, 10),
        profile_picture: '',
      })
      .select('id, name, role')
      .single()

    if (created) employees = [created]
  }

  if (!employees || employees.length === 0) {
    return NextResponse.json({ employee: null, machines: [] })
  }

  const employee = employees[0]

  // Fetch all machines assigned to this employee
  const { data: machines } = await supabase
    .from('surveycollection_planningtable')
    .select('id, fleet_number, machine_type, machine_belonging, deployment_status, health_status, project_name, section_name, assigned_to, operator_comment, litres, hour_meter')
    .eq('assigned_to', employee.name)
    .order('fleet_number')

  return NextResponse.json({ employee, machines: machines || [] })
}
