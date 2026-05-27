import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAdmin(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user || session.user.role !== 'admin') return null
  return session.user
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()
  // Handle the header spanning 2 lines (the "Total Length\nto order" column)
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')

  // First two lines together form the header due to a quoted newline in column name
  // Find where data rows start: skip lines until we hit a line starting with a known project name
  // Safer: join first two lines as header, rest are data
  let dataStart = 1
  if (lines.length > 1 && !lines[1].match(/^[A-Za-z]/)) {
    // line 1 is continuation of header
    dataStart = 2
  }

  const rows: Record<string, any>[] = []
  const skipped: string[] = []

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    // CSV columns (0-indexed):
    // 0:projectname 1:sectionname 2:projectsection 3:name 4:label 5:staion_m
    // 6:list_name 7:item 8:Side 9:full_concatenate 10:Chainage 11:Measurments
    // 12:Concatenate 13:Northing 14:Easting 15:nbr_cell 16:Length 17:Status
    // 18:Total Length to order 19:Consideration status 20:Comment 21:LOW POINT ELEVATION

    const projectName = cols[0]
    const sectionName = cols[1]
    const chainage    = cols[10] || cols[3]
    const item        = cols[7]
    const side        = cols[8]

    if (!projectName || !chainage || !item || !side) {
      skipped.push(`Line ${i + 1}: missing key fields`)
      continue
    }

    const northing = cols[13] ? parseFloat(cols[13]) : null
    const easting  = cols[14] ? parseFloat(cols[14]) : null
    const length   = cols[16] ? parseFloat(cols[16]) : null
    const totalLen = cols[18] ? parseFloat(cols[18]) : null
    const chainageM = cols[5] ? parseFloat(cols[5]) : null

    rows.push({
      project_name:          projectName,
      section_name:          sectionName,
      chainage,
      chainage_m:            chainageM,
      item,
      side,
      measurements:          cols[11] || null,
      nbr_cell:              cols[15] || null,
      length:                isNaN(length!) ? null : length,
      status:                cols[17] || null,
      total_length_to_order: isNaN(totalLen!) ? null : totalLen,
      consideration_status:  cols[19] || null,
      comment:               cols[20] || null,
      low_point_elevation:   cols[21] || null,
      northing:              isNaN(northing!) ? null : northing,
      easting:               isNaN(easting!) ? null : easting,
    })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid rows found in CSV' }, { status: 400 })
  }

  // Upsert in batches of 200
  const BATCH = 200
  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error, count } = await supabase
      .from('hitech_report_component')
      .upsert(batch, { onConflict: 'project_name,section_name,chainage,item,side', count: 'exact' })
    if (error) errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`)
    else inserted += count ?? batch.length
  }

  return NextResponse.json({
    ok: true,
    inserted,
    skipped: skipped.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// GET — count how many rows are already imported
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { count } = await supabase
    .from('hitech_report_component')
    .select('*', { count: 'exact', head: true })
  return NextResponse.json({ count: count ?? 0 })
}
