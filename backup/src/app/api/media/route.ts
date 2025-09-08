// import { NextRequest } from 'next/server';
// import axios from 'axios';

// // In-memory LRU-ish cache (simple Map with size cap)
// interface CacheEntry { data: Buffer; contentType: string; ts: number; }
// const MEDIA_CACHE = new Map<string, CacheEntry>();
// const NEGATIVE_CACHE = new Map<string, number>(); // store timestamp of last 403/404
// const NEG_TTL_MS = 5 * 60 * 1000; // 5 minutes
// const MAX_ITEMS = 200; // tune as needed
// const TTL_MS = 1000 * 60 * 30; // 30 minutes

// let trestleToken: string | null = null; // cached OAuth token
// let trestleExpiry = 0; // epoch ms expiry

// export async function getTrestleToken(): Promise<string> { // exported for diagnose route
//   // Direct static API key shortcut (if platform supports)
//   if (process.env.TRESTLE_API_KEY) {
//     return process.env.TRESTLE_API_KEY;
//   }
//   if (trestleToken && Date.now() < trestleExpiry - 60_000) return trestleToken;
//   const { TRESTLE_API_ID, TRESTLE_API_PASSWORD, TRESTLE_OAUTH_URL, TRESTLE_OAUTH_SCOPE, TRESTLE_OAUTH_AUDIENCE } = process.env;
//   if (!TRESTLE_API_ID || !TRESTLE_API_PASSWORD || !TRESTLE_OAUTH_URL) {
//     throw new Error('Trestle credentials not configured');
//   }
//   const scope = TRESTLE_OAUTH_SCOPE || 'api media'; // ensure required scopes
//   const form = new URLSearchParams({
//     grant_type: 'client_credentials',
//     client_id: TRESTLE_API_ID,
//     client_secret: TRESTLE_API_PASSWORD,
//     scope
//   });
//   // Audience is sometimes required for media endpoints; include only if provided
//   if (TRESTLE_OAUTH_AUDIENCE) form.set('audience', TRESTLE_OAUTH_AUDIENCE);
//   const resp = await axios.post(TRESTLE_OAUTH_URL, form, {
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'User-Agent': 'PropertyMediaProxy/1.0' },
//     timeout: 20000
//   });
//   trestleToken = resp.data.access_token;
//   trestleExpiry = Date.now() + resp.data.expires_in * 1000;
//   console.log('[media-proxy] New token acquired', { scope, audience: !!TRESTLE_OAUTH_AUDIENCE, expiresIn: resp.data.expires_in });
//   return trestleToken!;
// }

// // Generic authenticated JSON fetch for Trestle OData
// async function getJsonWithAuth<T>(url: string): Promise<T> {
//   const token = await getTrestleToken();
//   const res = await axios.get<T>(url, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//   // OData-friendly minimal metadata Accept improves compatibility & reduces payload
//   Accept: 'application/json;odata.metadata=minimal',
//       'User-Agent': 'PropertyMediaProxy/1.0'
//     },
//     timeout: 20000,
//     validateStatus: s => s >= 200 && s < 500
//   });
//   if (res.status < 200 || res.status >= 300) {
//     const err: any = new Error(`Upstream ${res.status}`);
//     err.status = res.status;
//     err.data = res.data;
//     throw err;
//   }
//   return res.data;
// }

// interface MediaODataRow { MediaURL?: string; Order?: number; }
// interface MediaODataResponse { value: MediaODataRow[]; }

// export const DEFAULT_BASE_URL = process.env.TRESTLE_BASE_URL || 'https://api-trestle.corelogic.com/trestle/odata';

// // Resolve a fresh array of Media rows for a listing key
// async function fetchMediaList(listingKey: string): Promise<MediaODataRow[]> {
//   // Build OData query with encoding to avoid 403/400 due to spaces or special chars.
//   const base = DEFAULT_BASE_URL.replace(/\/$/, '');
//   const filter = encodeURIComponent(`ResourceRecordKey eq '${listingKey}'`);
//   const orderby = encodeURIComponent('Order');
//   const select = encodeURIComponent('MediaURL,Order');
//   const url = `${base}/Media?$filter=${filter}&$orderby=${orderby}&$select=${select}&$top=60`;
//   const json = await getJsonWithAuth<MediaODataResponse>(url);
//   return json.value || [];
// }

// // Given listingKey + 1-based object index, fetch a fresh MediaURL (never reuse old presigned links)
// async function fetchFreshMediaUrl(listingKey: string, objectIndex: number): Promise<string | null> {
//   try {
//     const rows = await fetchMediaList(listingKey);
//     if (!rows.length) return null;
//     const idx = Math.max(0, objectIndex - 1); // objectIndex is 1-based
//     const chosen = rows[idx] || rows[0];
//     return chosen.MediaURL || null;
//   } catch (e) {
//     console.error('[media-proxy] fetchFreshMediaUrl error', { listingKey, objectIndex, error: (e as any)?.message });
//     return null;
//   }
// }

// // Parse stale PHOTO-Jpeg URL to extract listingKey & objectId
// function parsePhotoJpegPath(urlStr: string): { listingKey: string; objectId: number } | null {
//   try {
//     const u = new URL(urlStr);
//     const parts = u.pathname.split('/').filter(Boolean); // remove empties
//     // Expect ... /trestle/Media/Property/PHOTO-Jpeg/<ListingKey>/<ObjectID>/...
//     const mediaIdx = parts.findIndex(p => p.toLowerCase() === 'media');
//     if (mediaIdx === -1) return null;
//     if (parts[mediaIdx + 1] !== 'Property') return null;
//     if (parts[mediaIdx + 2] !== 'PHOTO-Jpeg') return null;
//     const listingKey = parts[mediaIdx + 3];
//     const objectIdStr = parts[mediaIdx + 4];
//     if (!listingKey || !objectIdStr) return null;
//     const objectId = parseInt(objectIdStr, 10);
//     if (!objectId || objectId < 1) return null;
//     return { listingKey, objectId };
//   } catch {
//     return null;
//   }
// }

// function getFromCache(key: string): CacheEntry | null {
//   const entry = MEDIA_CACHE.get(key);
//   if (!entry) return null;
//   if (Date.now() - entry.ts > TTL_MS) { MEDIA_CACHE.delete(key); return null; }
//   // touch for LRU
//   MEDIA_CACHE.delete(key);
//   MEDIA_CACHE.set(key, entry);
//   return entry;
// }

// function putInCache(key: string, data: Buffer, contentType: string) {
//   if (MEDIA_CACHE.size >= MAX_ITEMS) {
//     // delete oldest (first inserted)
//     const first = MEDIA_CACHE.keys().next().value;
//     if (first) MEDIA_CACHE.delete(first);
//   }
//   MEDIA_CACHE.set(key, { data, contentType, ts: Date.now() });
// }

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// // 1x1 transparent PNG fallback
// const FALLBACK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
// const FALLBACK_BUFFER = Buffer.from(FALLBACK_IMAGE_BASE64, 'base64');

// export async function GET(req: NextRequest) {
//   const search = req.nextUrl.searchParams;
//   const targetUrl = search.get('url'); // legacy / explicit link mode
//   const listingKey = search.get('listingKey'); // new dynamic mode
//   const objectParam = search.get('object'); // 1-based object index
//   const debug = search.get('debug') === '1';
//   const strictGlobal = process.env.STRICT_MEDIA_PROXY === '1';
//   const strict = search.get('strict') === '1' || strictGlobal;

//   // New listingKey/object path: always resolve a fresh MediaURL (never use stale signed URL).
//   if (listingKey) {
//     const objectIndex = Math.max(1, parseInt(objectParam || '1', 10) || 1);
//     const listingCacheKey = `LISTING:${listingKey}:${objectIndex}`;
//     const negTs = NEGATIVE_CACHE.get(listingCacheKey);
//     if (negTs && Date.now() - negTs < NEG_TTL_MS) {
//       return new Response(new Uint8Array(FALLBACK_BUFFER), {
//         status: 200,
//         headers: {
//           'Content-Type': 'image/png',
//           'Cache-Control': 'public, max-age=60',
//           'X-Fallback': 'true',
//           'X-Negative-Cache': 'HIT',
//           'X-Listing-Key': listingKey,
//           'X-Object': String(objectIndex)
//         }
//       });
//     }
//     const cached = getFromCache(listingCacheKey);
//     if (cached) {
//       return new Response(new Uint8Array(cached.data), {
//         status: 200,
//         headers: {
//           'Content-Type': cached.contentType,
//           'Cache-Control': 'public, max-age=900',
//           'X-Cache': 'HIT',
//           'X-Listing-Key': listingKey,
//           'X-Object': String(objectIndex)
//         }
//       });
//     }
//     // Always query for a fresh MediaURL
//     const freshUrl = await fetchFreshMediaUrl(listingKey, objectIndex);
//     if (!freshUrl) {
//       NEGATIVE_CACHE.set(listingCacheKey, Date.now());
//       return new Response(new Uint8Array(FALLBACK_BUFFER), {
//         status: 404,
//         headers: {
//           'Content-Type': 'image/png',
//           'Cache-Control': 'public, max-age=120',
//           'X-Fallback': 'true',
//           'X-Listing-Key': listingKey,
//           'X-Object': String(objectIndex)
//         }
//       });
//     }
//     // Fetch the image bytes for the fresh URL
//     try {
//       const imgResp = await axios.get<ArrayBuffer>(freshUrl, {
//         headers: {
//           Accept: 'image/avif,image/webp,image/apng,image/*;q=0.8,*/*;q=0.5',
//           'User-Agent': 'PropertyMediaProxy/1.0'
//         },
//         responseType: 'arraybuffer',
//         timeout: 30000,
//         validateStatus: s => s >= 200 && s < 500
//       });
//       if (imgResp.status !== 200) {
//         if (imgResp.status === 404) NEGATIVE_CACHE.set(listingCacheKey, Date.now());
//         return new Response(new Uint8Array(FALLBACK_BUFFER), {
//           status: imgResp.status === 404 ? 404 : 502,
//           headers: {
//             'Content-Type': 'image/png',
//             'X-Fallback': 'true',
//             'X-Upstream-Status': String(imgResp.status),
//             'X-Listing-Key': listingKey,
//             'X-Object': String(objectIndex)
//           }
//         });
//       }
//       const contentType = imgResp.headers['content-type'] || 'image/jpeg';
//       if (!/^image\//i.test(contentType)) {
//         return new Response('Unsupported Media Type', { status: 415 });
//       }
//       const buf = Buffer.from(new Uint8Array(imgResp.data as unknown as ArrayBuffer));
//       putInCache(listingCacheKey, buf, contentType);
//       return new Response(new Uint8Array(buf), {
//         status: 200,
//         headers: {
//           'Content-Type': contentType,
//           'Cache-Control': 'public, max-age=900',
//           'X-Cache': 'MISS',
//           'X-Listing-Key': listingKey,
//           'X-Object': String(objectIndex)
//         }
//       });
//     } catch (e: any) {
//       console.error('[media-proxy] listingKey fetch error', { listingKey, objectIndex, message: e?.message });
//       return new Response(new Uint8Array(FALLBACK_BUFFER), {
//         status: 502,
//         headers: {
//           'Content-Type': 'image/png',
//           'X-Fallback': 'true',
//           'X-Listing-Key': listingKey,
//           'X-Object': String(objectIndex)
//         }
//       });
//     }
//   }

//   // Legacy mode: explicit URL required
//   if (!targetUrl) {
//     return new Response(JSON.stringify({ error: 'Missing url or listingKey param' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
//   }
//   if (!/corelogic|trestle/i.test(targetUrl)) {
//     return new Response('Forbidden host', { status: 403 });
//   }
//   const cacheKey = targetUrl;
//   const now = Date.now();
//   const negTs = NEGATIVE_CACHE.get(cacheKey);
//   if (negTs && now - negTs < NEG_TTL_MS) {
//     return new Response(new Uint8Array(FALLBACK_BUFFER), {
//       status: 200,
//       headers: {
//         'Content-Type': 'image/png',
//         'Cache-Control': 'public, max-age=60',
//         'X-Fallback': 'true',
//         'X-Negative-Cache': 'HIT'
//       }
//     });
//   }
//   const cached = getFromCache(cacheKey);
//   if (cached) {
//     return new Response(new Uint8Array(cached.data), {
//       status: 200,
//       headers: {
//         'Content-Type': cached.contentType,
//         'Cache-Control': 'public, max-age=900',
//         'X-Cache': 'HIT'
//       }
//     });
//   }

//   async function fetchOnce(refreshToken = false) {
//     if (refreshToken) {
//       trestleToken = null; // force refresh for OAuth path
//     }
//     const urlStr = targetUrl as string; // targetUrl already validated non-null earlier
//     let needsAuth = false;
//     try {
//       const host = new URL(urlStr).hostname.toLowerCase();
//       if (host === 'api-trestle.corelogic.com') needsAuth = true; // explicit requirement
//     } catch {}
//     let authHeader: string | undefined;
//     if (needsAuth) {
//       const token = await getTrestleToken();
//       authHeader = `Bearer ${token}`;
//     }
//     return axios.get<ArrayBuffer>(targetUrl as string, {
//       headers: {
//         ...(authHeader ? { Authorization: authHeader } : {}),
//         Accept: 'image/avif,image/webp,image/apng,image/*;q=0.8,*/*;q=0.5',
//         'User-Agent': 'PropertyMediaProxy/1.0'
//       },
//       responseType: 'arraybuffer',
//       timeout: 30000,
//       validateStatus: s => s >= 200 && s < 500 // allow 4xx to inspect
//     });
//   }

//   try {
//     let resp = await fetchOnce(false);
//     if (resp.status === 401 || resp.status === 403) {
//       // retry once with refreshed token
//       resp = await fetchOnce(true);
//     }
//     if (resp.status === 401 || resp.status === 403) {
//       // Token refresh didn't help. If URL looks like a stale PHOTO-Jpeg link, rehydrate.
//       const parsed = parsePhotoJpegPath(targetUrl);
//       if (parsed) {
//         const freshUrl = await fetchFreshMediaUrl(parsed.listingKey, parsed.objectId);
//         if (freshUrl) {
//           try {
//             const reResp = await axios.get<ArrayBuffer>(freshUrl, {
//               headers: {
//                 Accept: 'image/avif,image/webp,image/apng,image/*;q=0.8,*/*;q=0.5',
//                 'User-Agent': 'PropertyMediaProxy/1.0'
//               },
//               responseType: 'arraybuffer',
//               timeout: 30000,
//               validateStatus: s => s >= 200 && s < 500
//             });
//             if (reResp.status === 200) {
//               const contentType = reResp.headers['content-type'] || 'image/jpeg';
//               if (!/^image\//i.test(contentType)) {
//                 return new Response('Unsupported Media Type', { status: 415 });
//               }
//               const buf = Buffer.from(new Uint8Array(reResp.data as unknown as ArrayBuffer));
//               putInCache(cacheKey, buf, contentType); // cache under original stale key for future quick hits until expiry
//               return new Response(new Uint8Array(buf), {
//                 status: 200,
//                 headers: {
//                   'Content-Type': contentType,
//                   'Cache-Control': 'public, max-age=900',
//                   'X-Cache': 'MISS',
//                   'X-Rehydrated': 'true'
//                 }
//               });
//             }
//           } catch (e) {
//             console.error('[media-proxy] rehydration fetch failed', { url: freshUrl, message: (e as any)?.message });
//           }
//         }
//       }
//     }
//     if (resp.status < 200 || resp.status >= 300) {
//       // Handle specific upstream outcomes per requirements
//       if (resp.status === 404) {
//         NEGATIVE_CACHE.set(cacheKey, Date.now());
//         return new Response(new Uint8Array(FALLBACK_BUFFER), {
//           status: 404,
//           headers: {
//             'Content-Type': 'image/png',
//             'Cache-Control': 'public, max-age=120',
//             'X-Fallback': 'true',
//             'X-Upstream-Status': '404'
//           }
//         });
//       }
//       if (resp.status === 401 || resp.status === 403) {
//         NEGATIVE_CACHE.set(cacheKey, Date.now());
//         return new Response('Forbidden', {
//           status: 403,
//           headers: {
//             'Cache-Control': 'no-cache, max-age=0',
//             'X-Upstream-Status': String(resp.status)
//           }
//         });
//       }
//       // other error
//       return new Response('Bad Gateway', {
//         status: 502,
//         headers: { 'Cache-Control': 'no-cache, max-age=0', 'X-Upstream-Status': String(resp.status) }
//       });
//     }
//     const contentType = resp.headers['content-type'] || 'image/jpeg';
//     if (!/^image\//i.test(contentType)) {
//       return new Response('Unsupported Media Type', { status: 415 });
//     }
//     const arrayBufferData = resp.data as unknown as ArrayBuffer;
//     const buf = Buffer.from(new Uint8Array(arrayBufferData));
//     putInCache(cacheKey, buf, contentType);
//     return new Response(new Uint8Array(buf), {
//       status: 200,
//       headers: {
//         'Content-Type': contentType,
//         'Cache-Control': 'public, max-age=900',
//         'X-Cache': 'MISS'
//       }
//     });
//   } catch (e: any) {
//     const upstreamStatus = e?.response?.status;
//     const shortUrl = targetUrl.replace(/^https?:\/\//,'').split('?')[0];
//     const upstreamBody = debug && e?.response?.data ? (typeof e.response.data === 'string' ? e.response.data.slice(0,500) : undefined) : undefined;
//     console.error('Media proxy exception:', { status: upstreamStatus, message: e?.message, url: shortUrl, body: upstreamBody });
//     if (upstreamStatus === 404) {
//       return new Response(new Uint8Array(FALLBACK_BUFFER), { status: 404, headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true', 'X-Upstream-Status': '404' } });
//     }
//     if (upstreamStatus === 401 || upstreamStatus === 403) {
//       return new Response('Forbidden', { status: 403, headers: { 'X-Upstream-Status': String(upstreamStatus) } });
//     }
//     return new Response('Bad Gateway', { status: 502, headers: { 'X-Upstream-Status': String(upstreamStatus || 'unknown') } });
//   }
// }



import { NextRequest } from 'next/server';
import axios from 'axios';

// In-memory LRU-ish cache (simple Map with size cap)
interface CacheEntry { data: Buffer; contentType: string; ts: number; }
const MEDIA_CACHE = new Map<string, CacheEntry>();
const NEGATIVE_CACHE = new Map<string, number>(); // store timestamp of last 403/404
const NEG_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ITEMS = 200;
const TTL_MS = 1000 * 60 * 30; // 30 minutes

let trestleToken: string | null = null;
let trestleExpiry = 0;

// 1x1 transparent PNG fallback
const FALLBACK_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const FALLBACK_BUFFER = Buffer.from(FALLBACK_IMAGE_BASE64, 'base64');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getTrestleToken(): Promise<string> {
  if (process.env.TRESTLE_API_KEY) return process.env.TRESTLE_API_KEY;
  if (trestleToken && Date.now() < trestleExpiry - 60_000) return trestleToken;

  const {
    TRESTLE_API_ID,
    TRESTLE_API_PASSWORD,
    TRESTLE_OAUTH_URL,
    TRESTLE_OAUTH_SCOPE,
    TRESTLE_OAUTH_AUDIENCE
  } = process.env;

  if (!TRESTLE_API_ID || !TRESTLE_API_PASSWORD || !TRESTLE_OAUTH_URL) {
    throw new Error('Trestle credentials not configured');
  }

  const scope = TRESTLE_OAUTH_SCOPE || 'api media';
  const form = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: TRESTLE_API_ID,
    client_secret: TRESTLE_API_PASSWORD,
    scope
  });
  if (TRESTLE_OAUTH_AUDIENCE) form.set('audience', TRESTLE_OAUTH_AUDIENCE);

  const resp = await axios.post(TRESTLE_OAUTH_URL, form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'PropertyMediaProxy/1.0'
    },
    timeout: 20000
  });

  trestleToken = resp.data.access_token;
  trestleExpiry = Date.now() + resp.data.expires_in * 1000;
  // console.log('[media-proxy] New token acquired', {
  //   scope,
  //   audience: !!TRESTLE_OAUTH_AUDIENCE,
  //   expiresIn: resp.data.expires_in
  // });
  return trestleToken!;
}

async function getJsonWithAuth<T>(url: string): Promise<T> {
  const token = await getTrestleToken();
  const res = await axios.get<T>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json;odata.metadata=minimal',
      'User-Agent': 'PropertyMediaProxy/1.0'
    },
    timeout: 20000,
    validateStatus: (s) => s >= 200 && s < 500
  });
  if (res.status < 200 || res.status >= 300) {
    const err: any = new Error(`Upstream ${res.status}`);
    err.status = res.status;
    err.data = res.data;
    throw err;
  }
  return res.data;
}

interface MediaODataRow {
  MediaURL?: string;
  Order?: number;
}
interface MediaODataResponse {
  value: MediaODataRow[];
}

const DEFAULT_BASE_URL =
  process.env.TRESTLE_BASE_URL ||
  'https://api-trestle.corelogic.com/trestle/odata';

async function fetchMediaList(listingKey: string): Promise<MediaODataRow[]> {
  const base = DEFAULT_BASE_URL.replace(/\/$/, '');
  const filter = encodeURIComponent(`ResourceRecordKey eq '${listingKey}'`);
  const orderby = encodeURIComponent('Order');
  const select = encodeURIComponent('MediaURL,Order');
  const url = `${base}/Media?$filter=${filter}&$orderby=${orderby}&$select=${select}&$top=60`;

  try {
    const json = await getJsonWithAuth<MediaODataResponse>(url);
  // if (!json.value || json.value.length === 0) {
  //   console.warn('[media-proxy] fetchMediaList: no media rows', { listingKey, url });
  // } else {
  //   console.log('[media-proxy] fetchMediaList rows', { listingKey, count: json.value.length, sample: json.value.slice(0, 3) });
  // }
    return json.value || [];
  } catch (e: any) {
    // console.error('[media-proxy] fetchMediaList error', { listingKey, url, message: e?.message, status: e?.status, data: e?.data });
    throw e;
  }
}

async function fetchFreshMediaUrl(
  listingKey: string,
  objectIndex: number
): Promise<string | null> {
  try {
    const rows = await fetchMediaList(listingKey);
    if (!rows.length) return null;
    const idx = Math.max(0, objectIndex - 1);
    const chosen = rows[idx] || rows[0];
    return chosen.MediaURL || null;
  } catch {
    return null;
  }
}

function parsePhotoJpegPath(
  urlStr: string
): { listingKey: string; objectId: number } | null {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    const mediaIdx = parts.findIndex((p) => p.toLowerCase() === 'media');
    if (mediaIdx === -1) return null;
    if (parts[mediaIdx + 1] !== 'Property') return null;
    if (parts[mediaIdx + 2] !== 'PHOTO-Jpeg') return null;
    const listingKey = parts[mediaIdx + 3];
    const objectIdStr = parts[mediaIdx + 4];
    if (!listingKey || !objectIdStr) return null;
    const objectId = parseInt(objectIdStr, 10);
    if (!objectId || objectId < 1) return null;
    return { listingKey, objectId };
  } catch {
    return null;
  }
}

function getFromCache(key: string): CacheEntry | null {
  const entry = MEDIA_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    MEDIA_CACHE.delete(key);
    return null;
  }
  MEDIA_CACHE.delete(key);
  MEDIA_CACHE.set(key, entry);
  return entry;
}

function putInCache(key: string, data: Buffer, contentType: string) {
  if (MEDIA_CACHE.size >= MAX_ITEMS) {
    const first = MEDIA_CACHE.keys().next().value;
    if (first) MEDIA_CACHE.delete(first);
  }
  MEDIA_CACHE.set(key, { data, contentType, ts: Date.now() });
}

function normalizeImageContentType(headerValue: string | undefined) {
  const rawType = String(headerValue || '').toLowerCase();
  const isImageLike =
    rawType.startsWith('image/') ||
    rawType === '' ||
    rawType === 'application/octet-stream';
  const finalType = rawType.startsWith('image/') ? rawType : 'image/jpeg';
  return { ok: isImageLike, finalType, rawType };
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const targetUrl = search.get('url');
  const listingKey = search.get('listingKey');
  const objectParam = search.get('object');
  const debug = search.get('debug') === '1';

  // -------------------------
  // ListingKey/Object Mode
  // -------------------------
  if (listingKey) {
    const objectIndex = Math.max(1, parseInt(objectParam || '1', 10) || 1);
    const listingCacheKey = `LISTING:${listingKey}:${objectIndex}`;
    const negTs = NEGATIVE_CACHE.get(listingCacheKey);
    if (negTs && Date.now() - negTs < NEG_TTL_MS) {
      return new Response(new Uint8Array(FALLBACK_BUFFER), {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
      });
    }

    const cached = getFromCache(listingCacheKey);
    if (cached) {
      return new Response(new Uint8Array(cached.data), {
        status: 200,
        headers: { 'Content-Type': cached.contentType, 'X-Cache': 'HIT' }
      });
    }

    const freshUrl = await fetchFreshMediaUrl(listingKey, objectIndex);
    if (!freshUrl) {
      NEGATIVE_CACHE.set(listingCacheKey, Date.now());
      return new Response(new Uint8Array(FALLBACK_BUFFER), {
        status: 404,
        headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
      });
    }

    try {
      const imgResp = await axios.get<ArrayBuffer>(freshUrl, {
        headers: { 'User-Agent': 'PropertyMediaProxy/1.0' },
        responseType: 'arraybuffer',
        timeout: 30000,
        validateStatus: (s) => s >= 200 && s < 500
      });
      if (imgResp.status !== 200) {
        NEGATIVE_CACHE.set(listingCacheKey, Date.now());
        return new Response(new Uint8Array(FALLBACK_BUFFER), {
          status: imgResp.status,
          headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
        });
      }

      const { ok, finalType, rawType } = normalizeImageContentType(
        imgResp.headers['content-type']
      );
      if (!ok) {
  // console.warn('[media-proxy] Non-image content-type', { listingKey, objectIndex, rawType, url: freshUrl });
        NEGATIVE_CACHE.set(listingCacheKey, Date.now());
        return new Response(new Uint8Array(FALLBACK_BUFFER), {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'X-Fallback': 'true',
            'X-Reason': 'unsupported-type'
          }
        });
      }

      const buf = Buffer.from(
        new Uint8Array(imgResp.data as unknown as ArrayBuffer)
      );
      putInCache(listingCacheKey, buf, finalType);
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: { 'Content-Type': finalType, 'X-Cache': 'MISS' }
      });
    } catch {
      return new Response(new Uint8Array(FALLBACK_BUFFER), {
        status: 502,
        headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
      });
    }
  }

  // -------------------------
  // Legacy URL Mode
  // -------------------------
  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing url or listingKey param' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!/corelogic|trestle/i.test(targetUrl)) {
    return new Response('Forbidden host', { status: 403 });
  }

  const cacheKey = targetUrl;
  const negTs = NEGATIVE_CACHE.get(cacheKey);
  if (negTs && Date.now() - negTs < NEG_TTL_MS) {
    return new Response(new Uint8Array(FALLBACK_BUFFER), {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
    });
  }

  const cached = getFromCache(cacheKey);
  if (cached) {
    return new Response(new Uint8Array(cached.data), {
      status: 200,
      headers: { 'Content-Type': cached.contentType, 'X-Cache': 'HIT' }
    });
  }

  try {
    const resp = await axios.get<ArrayBuffer>(targetUrl, {
      headers: { 'User-Agent': 'PropertyMediaProxy/1.0' },
      responseType: 'arraybuffer',
      timeout: 30000,
      validateStatus: (s) => s >= 200 && s < 500
    });

    if (resp.status !== 200) {
      NEGATIVE_CACHE.set(cacheKey, Date.now());
      return new Response(new Uint8Array(FALLBACK_BUFFER), {
        status: resp.status,
        headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
      });
    }

    const { ok, finalType, rawType } = normalizeImageContentType(
      resp.headers['content-type']
    );
    if (!ok) {
  // console.warn('[media-proxy] Non-image content-type (legacy)', { rawType, url: targetUrl });
      NEGATIVE_CACHE.set(cacheKey, Date.now());
      return new Response(new Uint8Array(FALLBACK_BUFFER), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'X-Fallback': 'true',
          'X-Reason': 'unsupported-type'
        }
      });
    }

    const buf = Buffer.from(
      new Uint8Array(resp.data as unknown as ArrayBuffer)
    );
    putInCache(cacheKey, buf, finalType);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: { 'Content-Type': finalType, 'X-Cache': 'MISS' }
    });
  } catch (e: any) {
  // console.error('[media-proxy] legacy fetch error', { url: targetUrl, message: e?.message });
    return new Response(new Uint8Array(FALLBACK_BUFFER), {
      status: 502,
      headers: { 'Content-Type': 'image/png', 'X-Fallback': 'true' }
    });
  }
}
