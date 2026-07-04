import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/employees/status-history?employee_id=123
// Returns status change history, newest first.
// Pass ?employee_id= to filter by a specific employee.
export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')

  let query = supabase
    .from('surveycollection_employee_status_history')
    .select('id, employee_id, employee_name, previous_status, new_status, changed_by, changed_at')
    .order('changed_at', { ascending: false })

  if (employeeId) {
    const eid = parseInt(employeeId)
    if (isNaN(eid)) return NextResponse.json({ error: 'Invalid employee_id' }, { status: 400 })
    query = query.eq('employee_id', eid)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
