import { NextRequest, NextResponse } from 'next/server'

export function checkApiKey(req: NextRequest): NextResponse | null {
  const key = req.nextUrl.searchParams.get('key') ?? req.headers.get('x-api-key') ?? ''
  if (!process.env.POWERBI_API_KEY || key !== process.env.POWERBI_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized — invalid or missing API key' }, { status: 401 })
  }
  return null
}
