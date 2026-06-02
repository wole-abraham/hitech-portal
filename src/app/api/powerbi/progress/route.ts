import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ok, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchAll(query: any): Promise<{ data: any[]; error: string | null }> {
  const all: any[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await query.range(from, from + PAGE - 1)
    if (error) return { data: [], error: error.message }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return { data: all, error: null }
}

export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const project = searchParams.get('project') || ''
    const like    = project ? `%${project.split(' ')[0]}%` : '%'

    const [entitiesRes, blocksRes, boqRes] = await Promise.all([
      fetchAll(
        supabase
          .from('hitech_construction_entities')
          .select('entity_name, side, status, planned_date, date_started, date_completed, label, project_name')
          .ilike('project_name', like)
          .order('planned_date', { ascending: true })
      ),
      fetchAll(
        supabase
          .from('hitech_construction_blocks')
          .select('entity_name, side, date_started, date_completed, total_segments, planned_start, block_start, block_end, project_name')
          .ilike('project_name', like)
          .order('date_started', { ascending: true })
      ),
      fetchAll(
        supabase
          .from('hitech_construction_boq')
          .select('description, activity_category, activity_type, qty, unit, rate, amount, project_name')
          .ilike('project_name', like)
          .order('activity_category', { ascending: true })
      ),
    ])

    const errors: Record<string, string> = {}
    if (entitiesRes.error) errors.entities = entitiesRes.error
    if (blocksRes.error)   errors.blocks   = blocksRes.error
    if (boqRes.error)      errors.boq      = boqRes.error

    return ok({
      entities: entitiesRes.data,
      blocks:   blocksRes.data,
      boq:      boqRes.data,
      ...(Object.keys(errors).length ? { errors } : {}),
    })
  } catch (e: any) {
    return err(e?.message ?? 'unexpected error')
  }
}
