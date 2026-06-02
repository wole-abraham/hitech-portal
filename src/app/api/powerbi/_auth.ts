import { NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

export function ok(data: unknown) {
  return NextResponse.json(data, { headers: CORS })
}

export function err(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status, headers: CORS })
}

export function options() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
