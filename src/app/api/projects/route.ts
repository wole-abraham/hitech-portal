import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('surveycollection_project')
      .select('id, name')
      .order('name')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Error fetching projects:', err)
    return NextResponse.json([], { status: 500 })
  }
}
