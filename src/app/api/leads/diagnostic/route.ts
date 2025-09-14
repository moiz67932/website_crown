import { NextRequest, NextResponse } from 'next/server';

// Simple diagnostics for Lofty credentials without creating a real lead.
// It attempts an authenticated OPTIONS or GET request to the leads endpoint with no body.
// If LOFTY_TEST_MODE=true it will just report test mode active.

export async function GET(_req: NextRequest) {
  const base = process.env.LOFTY_API_BASE || 'https://api.lofty.com/v1';
  const path = process.env.LOFTY_LEADS_PATH || '/leads';
  const header = process.env.LOFTY_AUTH_HEADER || 'Authorization';
  const scheme = process.env.LOFTY_AUTH_SCHEME ?? 'Bearer';
  const key = process.env.LOFTY_API_KEY || '';
  const testMode = process.env.LOFTY_TEST_MODE === 'true';

  if (!key) {
    return NextResponse.json({ ok: false, error: 'Missing LOFTY_API_KEY' }, { status: 400 });
  }
  if (testMode) {
    return NextResponse.json({ ok: true, testMode: true, message: 'Test mode enabled; credentials not validated against Lofty.' });
  }
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (header) headers[header] = scheme ? `${scheme} ${key}` : key;
  const url = `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : '/' + path}`;
  try {
    // Attempt a lightweight request; some APIs may not allow GET /leads without params -> fall back to 401/405 detection.
    const r = await fetch(url, { method: 'GET', headers });
    if (r.status === 401 || r.status === 403) {
      const text = await r.text().catch(() => '');
      return NextResponse.json({ ok: false, auth: false, status: r.status, body: text.slice(0,300) }, { status: 200 });
    }
    return NextResponse.json({ ok: true, status: r.status });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
