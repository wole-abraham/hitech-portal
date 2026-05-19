import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('surveycollection_section')
      .select('id, name, project_id')
      .order('name')

    if (error) throw error

    // Fetch project names to pair with sections
    const { data: projects } = await supabase
      .from('surveycollection_project')
      .select('id, name')

    const projectMap = Object.fromEntries(
      (projects || []).map(p => [p.id, p.name])
    )

    const sections = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      project_id: s.project_id,
      project_name: projectMap[s.project_id] || '—',
    }))

    return NextResponse.json(sections)
  } catch (err) {
    console.error('Error fetching sections:', err)
    return NextResponse.json([], { status: 500 })
  }
}
