import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'

const DOMAIN = 'compassmeet.com'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Never redirect well-known files (Android + iOS app verification)
  if (url.pathname.startsWith('/.well-known/')) {
    return NextResponse.next()
  }

  // apex → www
  if (host === DOMAIN) {
    url.hostname = 'www.compassmeet.com'
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
