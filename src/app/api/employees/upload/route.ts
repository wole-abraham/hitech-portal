import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, AppSession } from '@/lib/session'
import { r2Upload } from '@/lib/r2'

const ALLOWED_FOLDERS = ['employee-passport-photos', 'employee-passport-docs']

export async function POST(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!folder || !ALLOWED_FOLDERS.includes(folder))
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'bin'
    const key = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await r2Upload(key, buffer, file.type)
    return NextResponse.json({ url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
