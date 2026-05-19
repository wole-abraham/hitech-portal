import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const reportId = parseInt(id, 10)
  if (isNaN(reportId)) return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })

  const { photo_urls, video_url } = await req.json()
  const rows: object[] = []

  if (Array.isArray(photo_urls)) {
    photo_urls.filter(Boolean).forEach((url: string) => {
      rows.push({ report_id: reportId, media_type: 'image', file: url, uploaded_at: new Date().toISOString() })
    })
  }
  if (video_url) {
    rows.push({ report_id: reportId, media_type: 'video', file: video_url, uploaded_at: new Date().toISOString() })
  }

  if (rows.length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabase.from('hitech_report_hitechphoto').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
