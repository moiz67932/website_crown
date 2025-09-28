import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Build CSP as a single-line string to satisfy Edge runtime header validation
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://script.hotjar.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.openai.com https://api.elevenlabs.io https://*.qdrant.io https://*.google-analytics.com https://region1.google-analytics.com https://*.hotjar.com https://*.vercel-insights.com https://*.upstash.io",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    // Skip heavy work for static/assets/api
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

  // UTM & click id persistence (90d)
  const known = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid']
  const res = NextResponse.next()
  let wrote = false
  // Ensure cc_session cookie exists (anonymous session tracking)
  const CC_COOKIE = process.env.CC_SESSION_COOKIE_NAME || 'cc_session'
  const ccExisting = req.cookies.get(CC_COOKIE)?.value
  if (!ccExisting) {
    const uuid = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,10)}`
    res.cookies.set(CC_COOKIE, uuid, { path: '/', maxAge: 60*60*24*90, sameSite: 'lax' })
    wrote = true
  }
  for (const k of known) {
    const v = req.nextUrl.searchParams.get(k)
    if (v) {
      res.cookies.set(k, v, { path: '/', maxAge: 60*60*24*90 })
      wrote = true
    }
  }
  // (Referrals simplified) Removed legacy ?ref= capture and visit beacon.

  // Assign AB test cookie (client-side code can read it)
  if (process.env.AB_TEST_ENABLED === 'true') {
    const v = req.cookies.get('ab_variant')?.value
    if (!v) {
      const assigned = Math.random() < 0.5 ? 'A' : 'B'
      res.cookies.set('ab_variant', assigned, { path: '/', maxAge: 60*60*24*30 })
      wrote = true
    }
  }

  // Admin basic auth
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const auth = req.headers.get('authorization') || ''
    const [scheme, encoded] = auth.split(' ')
    if (scheme !== 'Basic' || !encoded) {
      return new NextResponse('Auth required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }})
    }
    let decoded = ''
    try {
      // atob is available in edge runtime
      decoded = (globalThis as any).atob ? (globalThis as any).atob(encoded) : ''
    } catch {}
    const [u,p] = decoded ? decoded.split(':') : ['','']
    const adminUser = process.env.NEXT_ADMIN_USER || process.env.ADMIN_USERNAME
    const adminPass = process.env.NEXT_ADMIN_PASS || process.env.ADMIN_PASSWORD
    if (u !== (adminUser || '') || p !== (adminPass || '')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Security headers
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-DNS-Prefetch-Control', 'on')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('Content-Security-Policy', CSP)

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
}
