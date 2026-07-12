import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'
import { parseChainage } from '@/lib/parseChainage'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })

  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

  if (rows.length === 0) return NextResponse.json({ error: 'File is empty or has no data rows.' }, { status: 400 })
  if (rows.length > 500) return NextResponse.json({ error: 'Maximum 500 rows per import.' }, { status: 400 })

  const now = new Date().toISOString()
  const results: { row: number; status: 'ok' | 'error'; id?: number; error?: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2 // 1-indexed + header

    // Normalise date (Excel may give a Date object or a string)
    let dateOfActivity: string | null = null
    if (r.date_of_activity instanceof Date) {
      dateOfActivity = r.date_of_activity.toISOString().slice(0, 10)
    } else if (typeof r.date_of_activity === 'string' && r.date_of_activity.trim()) {
      dateOfActivity = r.date_of_activity.trim()
    }

    const projectName = String(r.project_name || '').trim()
    const actCategory = String(r.activity_category || '').trim()
    const startCh     = String(r.start_chainage || '').trim()
    const endCh       = String(r.end_chainage || r.start_chainage || '').trim()

    if (!projectName || !actCategory || !startCh) {
      results.push({ row: rowNum, status: 'error', error: 'Missing project_name, activity_category, or start_chainage' })
      continue
    }

    const rawStart = parseChainage(startCh)
    const rawEnd   = parseChainage(endCh)
    const normStart = Math.min(rawStart, rawEnd)
    const normEnd   = Math.max(rawStart, rawEnd)

    const { data: report, error: insertErr } = await supabase
      .from('hitech_report_hitechreport')
      .insert({
        submitted_by_id:             session.user.id,
        submitted_at:                now,
        date_of_activity:            dateOfActivity,
        reporter_name:               String(r.reporter_name || '').trim(),
        weather:                     String(r.weather || '').trim(),
        project_name:                projectName,
        section_name:                String(r.section_name || '').trim(),
        activity_category:           actCategory,
        activity_type:               String(r.activity_type || '').trim(),
        activity_subtype:            String(r.activity_subtype || '').trim(),
        side:                        String(r.side || '').trim(),
        start_chainage:              startCh,
        end_chainage:                endCh,
        start_chainage_val:          normStart,
        end_chainage_val:            normEnd,
        start_chainage_lat:          '',
        start_chainage_long:         '',
        end_chainage_lat:            '',
        end_chainage_long:           '',
        activity_status:             String(r.activity_status || '').trim(),
        party_for_activity:          String(r.party_for_activity || '').trim(),
        subcontractor_name_activity: String(r.subcontractor_name_activity || '').trim(),
        comment_activity:            String(r.comment_activity || '').trim(),
        not_conforming:              String(r.not_conforming || 'No').trim(),
        not_conforming_issue:        String(r.not_conforming_issue || '').trim(),
        not_conforming_correction:   String(r.not_conforming_correction || '').trim(),
        car_used:                    String(r.car_used || 'No').trim(),
        team_car:                    String(r.team_car || '').trim(),
        custom_data:                 {},
      })
      .select('id')
      .single()

    if (insertErr || !report) {
      results.push({ row: rowNum, status: 'error', error: insertErr?.message ?? 'Insert failed' })
    } else {
      results.push({ row: rowNum, status: 'ok', id: report.id })
    }
  }

  const imported = results.filter(r => r.status === 'ok').length
  const failed   = results.filter(r => r.status === 'error').length

  return NextResponse.json({ imported, failed, results })
}
