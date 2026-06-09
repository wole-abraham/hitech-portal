import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ok, err, options } from '../_auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


export async function OPTIONS() { return options() }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const project   = searchParams.get('project')   || ''
    const like      = project ? `%${project.split(' ')[0]}%` : '%'
    const pageSize  = Math.min(parseInt(searchParams.get('page_size') || '1000', 10), 1000)
    const page      = Math.max(parseInt(searchParams.get('page')      || '1',    10), 1)
    const from      = (page - 1) * pageSize
    const to        = from + pageSize - 1

    const [entitiesRes, blocksRes, boqRes] = await Promise.all([
      supabase
        .from('hitech_construction_entities')
        .select('entity_name, side, status, planned_date, date_started, date_completed, label, project_name', { count: 'exact' })
        .ilike('project_name', like)
        .order('planned_date', { ascending: true })
        .range(from, to),
      supabase
        .from('hitech_construction_blocks')
        .select('entity_name, side, date_started, date_completed, total_segments, planned_start, block_start, block_end, project_name', { count: 'exact' })
        .ilike('project_name', like)
        .order('date_started', { ascending: true })
        .range(from, to),
      supabase
        .from('hitech_construction_boq')
        .select('description, activity_category, activity_type, qty, unit, rate, amount, project_name', { count: 'exact' })
        .ilike('project_name', like)
        .order('activity_category', { ascending: true })
        .range(from, to),
    ])

    const entitiesRes2 = { data: entitiesRes.data ?? [], count: entitiesRes.count ?? 0, error: entitiesRes.error }
    const blocksRes2   = { data: blocksRes.data   ?? [], count: blocksRes.count   ?? 0, error: blocksRes.error }
    const boqRes2      = { data: boqRes.data       ?? [], count: boqRes.count       ?? 0, error: boqRes.error }

    const errors: Record<string, string> = {}
    if (entitiesRes2.error) errors.entities = entitiesRes2.error.message
    if (blocksRes2.error)   errors.blocks   = blocksRes2.error.message
    if (boqRes2.error)      errors.boq      = boqRes2.error.message

    return ok({
      pagination: {
        page,
        page_size: pageSize,
        totals: {
          entities: entitiesRes2.count,
          blocks:   blocksRes2.count,
          boq:      boqRes2.count,
        },
        has_more: {
          entities: from + entitiesRes2.data.length < entitiesRes2.count,
          blocks:   from + blocksRes2.data.length   < blocksRes2.count,
          boq:      from + boqRes2.data.length       < boqRes2.count,
        },
      },
      entities: entitiesRes2.data,
      blocks:   blocksRes2.data,
      boq:      boqRes2.data,
      ...(Object.keys(errors).length ? { errors } : {}),
    })
  } catch (e: any) {
    return err(e?.message ?? 'unexpected error')
  }
}
