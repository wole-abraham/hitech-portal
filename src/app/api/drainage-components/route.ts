import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

let cache: any[] | null = null

function getData() {
  if (cache) return cache
  const raw = readFileSync(join(process.cwd(), 'public', 'drainage_components.json'), 'utf8')
  cache = JSON.parse(raw)
  return cache!
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project = searchParams.get('project') || ''
  const section = searchParams.get('section') || ''
  const side    = searchParams.get('side')    || ''

  const data = getData()

  const filtered = data.filter((r: any) => {
    if (project && r.project.toLowerCase() !== project.toLowerCase()) return false
    if (section && r.section.toLowerCase() !== section.toLowerCase()) return false
    if (side    && r.side.toLowerCase()    !== side.toLowerCase())    return false
    return true
  })

  return NextResponse.json(filtered)
}
