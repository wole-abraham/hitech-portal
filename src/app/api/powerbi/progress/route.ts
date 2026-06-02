import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ok, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function safeQuery(q: any): Promise<{ data: any[]; error: string | null }> {
  try {
    const { data, error } = await q
    if (error) return { data: [], error: error.message }
    return { data: data ?? [], error: null }
  } catch (e: any) {
    return { data: [], error: e?.message ?? 'query failed' }
  }
}

export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const project = searchParams.get('project') || ''
    const like    = project ? `%${project.split(' ')[0]}%` : '%'

    const [entitiesRes, blocksRes, boqRes] = await Promise.all([
      safeQuery(
        supabase
          .from('hitech_construction_entities')
          .select('entity_name, side, status, planned_date, date_started, date_completed, label, project_name')
          .ilike('project_name', like)
          .order('planned_date', { ascending: true })
          .limit(10000)
      ),
      safeQuery(
        supabase
          .from('hitech_construction_blocks')
          .select('entity_name, side, date_started, date_completed, total_segments, planned_start, block_start, block_end, project_name')
          .ilike('project_name', like)
          .order('date_started', { ascending: true })
          .limit(10000)
      ),
      safeQuery(
        supabase
          .from('hitech_construction_boq')
          .select('description, activity_category, activity_type, qty, unit, rate, amount, project_name')
          .ilike('project_name', like)
          .order('activity_category', { ascending: true })
          .limit(10000)
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
