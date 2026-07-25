import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_staff && !session.user.is_superuser) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { employee_id, fingerprint_device_id } = await req.json()
  if (!employee_id || fingerprint_device_id === undefined) {
    return NextResponse.json({ error: 'employee_id and fingerprint_device_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('surveycollection_employee')
    .update({ fingerprint_id: String(fingerprint_device_id) })
    .eq('id', employee_id)
    .select('id, name, fingerprint_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
