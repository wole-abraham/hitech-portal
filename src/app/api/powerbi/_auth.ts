import { NextRequest, NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function ok(data: unknown) {
  return NextResponse.json(data, { headers: { ...CORS, 'Content-Type': 'application/json' } })
}

export function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status, headers: CORS })
}

export function options() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export function toCSV(rows: Record<string, unknown>[]): NextResponse {
  if (!rows.length) return new NextResponse('', { headers: { ...CORS, 'Content-Type': 'text/csv' } })
  const keys = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [keys.join(','), ...rows.map(r => keys.map(k => escape(r[k])).join(','))]
  return new NextResponse(lines.join('\r\n'), {
    headers: { ...CORS, 'Content-Type': 'text/csv', 'Content-Disposition': 'inline' },
  })
}

export function respond(req: NextRequest, data: Record<string, unknown>[]) {
  const fmt = req.nextUrl.searchParams.get('format')
  return fmt === 'csv' ? toCSV(data) : ok(data)
}
