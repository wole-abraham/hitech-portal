import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, AppSession } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/signup']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/api/auth')) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next()
  // Allow all static assets (images, fonts, etc.)
  if (/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|otf|mp4|glb)$/i.test(pathname)) return NextResponse.next()

  const res = NextResponse.next()
  const session = await getIronSession<AppSession>(req, res, sessionOptions)

  if (!session.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const ADMIN_ONLY = ['/history', '/employees', '/equipment', '/dashboard', '/config', '/api/history', '/api/employees', '/api/equipment', '/api/dashboard', '/api/config']
  const isAdminOnly =
    ADMIN_ONLY.some(p => pathname.startsWith(p)) ||
    (pathname.startsWith('/reports') && !pathname.startsWith('/reports/start') && !pathname.startsWith('/reports/submit') && !pathname.startsWith('/reports/success')) ||
    (pathname.startsWith('/api/reports') && !pathname.startsWith('/api/reports/submit') && !pathname.startsWith('/api/reports/upload') && !pathname.startsWith('/api/reports/filters') && !pathname.startsWith('/api/reports/chainage') && !pathname.startsWith('/api/reports/reuse'))

  if (isAdminOnly && session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/portal', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
