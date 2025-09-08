import { NextRequest } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to read envs safely
function env(name: string, required = true) {
  const v = process.env[name];
  if (!v && required) {
    throw new Error(`Missing env: ${name}`);
  }
  return v || '';
}

export async function GET(_req: NextRequest) {
  try {
    // 1) Echo the envs we care about (NOT secrets), so we can verify values are present
    const TRESTLE_OAUTH_URL = env('TRESTLE_OAUTH_URL');
    const TRESTLE_OAUTH_SCOPE = env('TRESTLE_OAUTH_SCOPE', false) || 'api media';
    const TRESTLE_OAUTH_AUDIENCE = env('TRESTLE_OAUTH_AUDIENCE', false) || '';
    const TRESTLE_BASE_URL = env('TRESTLE_BASE_URL') || 'https://api-trestle.corelogic.com/trestle/odata';

    // DO NOT log secrets
    const hasClientId = !!process.env.TRESTLE_API_ID;
    const hasClientSecret = !!process.env.TRESTLE_API_PASSWORD;

    // 2) Try to mint a token *manually* (without reusing getTrestleToken), but DO NOT throw on 4xx
    const form = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.TRESTLE_API_ID || '',
      client_secret: process.env.TRESTLE_API_PASSWORD || '',
      scope: TRESTLE_OAUTH_SCOPE
    });
    if (TRESTLE_OAUTH_AUDIENCE) form.set('audience', TRESTLE_OAUTH_AUDIENCE);

    const tokenResp = await axios.post(
      TRESTLE_OAUTH_URL,
      form,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'PropertyMediaProxy/Diagnose/1.0'
        },
        // IMPORTANT: do not throw on 4xx—return the payload so we can see it
        validateStatus: (s) => s < 500,
        timeout: 20000
      }
    );

    // If token minting failed, report and bail early
    if (tokenResp.status !== 200 || !tokenResp.data?.access_token) {
      return new Response(JSON.stringify({
        step: 'oauth_token',
        note: 'Token request did not return 200 + access_token. Fix this first.',
        envSummary: {
          TRESTLE_OAUTH_URL,
          TRESTLE_OAUTH_SCOPE,
          TRESTLE_OAUTH_AUDIENCE,
          hasClientId,
          hasClientSecret
        },
        upstreamStatus: tokenResp.status,
        upstreamBodySnippet: typeof tokenResp.data === 'string'
          ? tokenResp.data.slice(0, 600)
          : tokenResp.data
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = tokenResp.data.access_token as string;

    // 3) Hit Property and Media with the minted token (still no-throw on 4xx)
    const base = TRESTLE_BASE_URL.replace(/\/$/, '');
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json;odata.metadata=minimal',
      'User-Agent': 'PropertyMediaProxy/Diagnose/1.0'
    };

    const [propResp, mediaResp] = await Promise.all([
      axios.get(`${base}/Property?$top=1&$select=ListingKey`, { headers, validateStatus: s => s < 500, timeout: 20000 }),
      axios.get(`${base}/Media?$top=1&$select=MediaKey`, { headers, validateStatus: s => s < 500, timeout: 20000 })
    ]);

    return new Response(JSON.stringify({
      step: 'odata_checks',
      envSummary: {
        TRESTLE_OAUTH_URL,
        TRESTLE_OAUTH_SCOPE,
        TRESTLE_OAUTH_AUDIENCE,
        TRESTLE_BASE_URL: base
      },
      tokenSummary: {
        receivedAccessToken: !!token,
        // Do NOT include the token itself in the response
      },
      propertyStatus: propResp.status,
      mediaStatus: mediaResp.status,
      propertyBodySnippet: typeof propResp.data === 'string'
        ? propResp.data.slice(0, 600)
        : propResp.data,
      mediaBodySnippet: typeof mediaResp.data === 'string'
        ? mediaResp.data.slice(0, 600)
        : mediaResp.data
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    // If *this* throws, it’s likely a missing env, network error, or unexpected exception
    return new Response(JSON.stringify({
      step: 'unexpected_exception',
      error: e?.message || String(e)
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
