import { CRMProvider } from "../provider";
import { LeadPayload } from "../types";

const BASE = process.env.LOFTY_API_BASE || "https://api.lofty.com/v1";
const KEY = process.env.LOFTY_API_KEY || "";
const TEST_MODE = process.env.LOFTY_TEST_MODE === 'true';

/**
 * Optional overrides to support vendors that want different auth styles or paths.
 *  - LOFTY_AUTH_HEADER:  default "Authorization"
 *  - LOFTY_AUTH_SCHEME:  default "Bearer" (set to "" to send raw key)
 *  - LOFTY_LEADS_PATH:   default "/leads"
 *
 * Examples:
 *   Authorization: Bearer <token>         (default)
 *   X-API-Key: <token>                     (set header to X-API-Key and scheme to "")
 */
const AUTH_HEADER = process.env.LOFTY_AUTH_HEADER || "Authorization";
const AUTH_SCHEME = process.env.LOFTY_AUTH_SCHEME ?? "Bearer";
const LEADS_PATH = process.env.LOFTY_LEADS_PATH || "/leads";

function mapToLofty(lead: LeadPayload) {
  return {
    first_name: lead.firstName ?? lead.fullName?.split(" ")?.[0] ?? "",
    last_name: lead.lastName ?? lead.fullName?.split(" ")?.slice(1).join(" ") ?? "",
    email: lead.email || "",
    phone: lead.phone || "",
    message: lead.message || "",
    source: lead.source || "website",
    tags: lead.tags || [],
    city: lead.city || "",
    state: lead.state || "",
    county: lead.county || "",
    budget_min: lead.budgetMin ?? null,
    budget_max: lead.budgetMax ?? null,
    beds: typeof lead.beds === "string" ? lead.beds : lead.beds ?? null,
    baths: typeof lead.baths === "string" ? lead.baths : lead.baths ?? null,
    property_type: lead.propertyType || null,
    utm_source: lead.source ?? null,
    utm_medium: lead.medium ?? null,
    utm_campaign: lead.campaign ?? null,
    utm_content: lead.content ?? null,
    utm_term: lead.term ?? null,
    gclid: lead.gclid ?? null,
    fbclid: lead.fbclid ?? null,
    page_url: lead.pageUrl ?? null,
    referer: lead.referer ?? null,
    user_agent: lead.userAgent ?? null,
    ip: lead.ip ?? null,
    score: lead.score ?? null,
  };
}

export function loftyProvider(): CRMProvider {
  return {
    async pushLead(lead: LeadPayload) {
  if (!KEY) throw new Error("Missing LOFTY_API_KEY env var");

      const mapped = mapToLofty(lead);
      const headers: Record<string, string> = {
          'X-API-Key': KEY, 
          'Content-Type': 'application/json'
      };

      // Choose auth style
      if (AUTH_HEADER) {
        headers[AUTH_HEADER] = AUTH_SCHEME
          ? `${AUTH_SCHEME} ${KEY}`
          : KEY;
      }

      const url = `${BASE.replace(/\/+$/, "")}${LEADS_PATH.startsWith("/") ? LEADS_PATH : `/${LEADS_PATH}`}`;

      if (TEST_MODE) {
        // eslint-disable-next-line no-console
        console.log('[lofty.test] would push lead (suppressed)', { url, hasKey: !!KEY, authHeader: AUTH_HEADER, scheme: AUTH_SCHEME });
        return { id: 'test-mode', raw: { test: true } };
      }

      const r = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(mapped),
      });

      if (!r.ok) {
        const text = await r.text().catch(() => "");
        const redactedKey = KEY ? KEY.slice(0, 4) + '...' + KEY.slice(-4) : 'none';
        // Provide structured information to aid debugging 401 vs validation errors
        const info = {
          status: r.status,
            statusText: r.statusText,
          base: BASE,
          path: LEADS_PATH,
          authHeader: AUTH_HEADER,
          authScheme: AUTH_SCHEME,
          keyPreview: redactedKey,
          bodyPreview: text.slice(0, 400),
          received: text ? text.length : 0,
        };
        // eslint-disable-next-line no-console
        console.warn('[lofty.push] non-ok response', info);
        if (r.status === 401 || r.status === 403) {
          throw new Error(`Lofty push failed: ${r.status} auth error. Check LOFTY_API_KEY value & permissions. Body: ${text || 'no body'}`);
        }
        throw new Error(`Lofty push failed: ${r.status} ${r.statusText} :: ${text || 'no body'}`);
      }

      const json: any = await r.json().catch(() => ({}));
      return { id: String(json?.id ?? json?.lead?.id ?? "unknown"), raw: json };
    },

    // Real signature verification can be added once Lofty shares their scheme
    verifyWebhookSignature(_payload: string, _signature: string | null) {
      return true;
    },
  };
}
