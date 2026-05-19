import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const projectName = (searchParams.get('project') || '').trim()
  const sectionName = (searchParams.get('section') || '').trim()
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = 10

  if (!projectName) return NextResponse.json({ results: [], has_more: false })

  // Look up project — use limit(1) instead of .single() to avoid throwing on 0/multiple rows
  const { data: projects, error: projErr } = await supabase
    .from('surveycollection_project')
    .select('id, name')
    .ilike('name', projectName)
    .limit(1)

  if (projErr || !projects || projects.length === 0) {
    return NextResponse.json({ results: [], has_more: false, _debug: `project not found: "${projectName}"` })
  }

  const projectId = projects[0].id

  // Base chainage query for this project
  let base = supabase
    .from('hitech_report_chainage')
    .select('chainage, name, label, section_name, latitude, longitude', { count: 'exact' })
    .eq('project_id', projectId)

  // Only filter by section if that section actually has chainage rows
  if (sectionName) {
    const { count: secCount } = await supabase
      .from('hitech_report_chainage')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('section_name', sectionName)

    if (secCount && secCount > 0) {
      base = base.eq('section_name', sectionName)
    }
  }

  // Text search across chainage, name, and label
  if (q) {
    base = base.or(`chainage.ilike.%${q}%,name.ilike.%${q}%,label.ilike.%${q}%`)
  }

  // Order: shortest name first (matches Django ordering by name_len, name)
  base = base.order('name', { ascending: true })

  const offset = (page - 1) * pageSize
  base = base.range(offset, offset + pageSize - 1)

  const { data, count, error } = await base

  if (error) {
    return NextResponse.json({ results: [], has_more: false, _debug: error.message })
  }

  return NextResponse.json({
    results: data || [],
    has_more: (offset + pageSize) < (count || 0),
    total: count || 0,
  })
}
