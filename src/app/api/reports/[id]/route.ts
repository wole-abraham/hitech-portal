import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, AppSession } from '@/lib/session'
import { r2Delete, r2KeyFromUrl } from '@/lib/r2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (!id || isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  // Fetch media rows first so we can remove files from storage
  const { data: photos } = await supabase
    .from('hitech_report_hitechphoto')
    .select('file')
    .eq('report_id', id)

  if (photos && photos.length > 0) {
    await Promise.allSettled(
      photos
        .map(p => r2KeyFromUrl(p.file as string))
        .filter((k): k is string => k !== null)
        .map(key => r2Delete(key))
    )
  }

  // Delete all child rows, then the report itself
  await Promise.all([
    supabase.from('hitech_report_hitechphoto').delete().eq('report_id', id),
    supabase.from('hitech_report_hitechemployee').delete().eq('report_id', id),
    supabase.from('hitech_report_hitechsupervisor').delete().eq('report_id', id),
    supabase.from('hitech_report_hitechengineer').delete().eq('report_id', id),
    supabase.from('hitech_report_hitechmachine').delete().eq('report_id', id),
  ])

  const { error } = await supabase
    .from('hitech_report_hitechreport')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
