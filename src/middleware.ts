import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  const cleaned = pathname.replace(/\/{2,}/g, '/')
  const lower = cleaned.toLowerCase()

  if (pathname !== lower || pathname !== cleaned) {
    const url = req.nextUrl.clone()
    url.pathname = lower
    url.search = search
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}
