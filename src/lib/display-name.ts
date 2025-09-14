// Shared helper to derive a user friendly display name for a property (list row or detail row)
// Input can be a DB row, API-mapped object, or detail object. We look for meta fields,
// then derive an address street line from available fields, then fall back to city/state, then listing key.

export interface GenericPropertyLike {
  listing_key?: string;
  id?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  h1_heading?: string | null;
  title?: string | null;
  seo_title?: string | null;
  raw_json?: any;
  // Potential granular address fields if ever exposed
  street_number?: string | null;
  street_name?: string | null;
  street_suffix?: string | null;
  unit_number?: string | null;
  [k: string]: any; // allow extra
}

const isMeaningful = (v: string | undefined | null) => {
  if (!v) return false;
  const s = v.trim();
  if (!s) return false;
  return !/^(property\s*address|n\/a|null|undefined)$/i.test(s);
};

const sanitize = (v?: string | null) => (v || '')
  .replace(/[_#]/g, ' ')
  .trim()
  .replace(/^0+\s+/, '')
  .replace(/\s{2,}/g, ' ');

function streetFromRaw(raw: any): string {
  if (!raw) return '';
  try {
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { return ''; }
    }
    const unparsed = raw.UnparsedAddress || raw.unparsed_address;
    if (unparsed) return sanitize(unparsed);
    const num = raw.StreetNumber || raw.street_number || raw.StreetNumberNumeric || '';
    const name = raw.StreetName || raw.street_name || '';
    const suffix = raw.StreetSuffix || raw.street_suffix || '';
    const unit = raw.UnitNumber || raw.unit_number || '';
    let pieces = [num, name, suffix].filter(Boolean).join(' ').trim();
    if (pieces && unit) pieces += ` #${unit}`;
    return sanitize(pieces);
  } catch { return ''; }
}

export function deriveDisplayName(p: GenericPropertyLike): string {
  const metaCandidates = [p.h1_heading, p.title, p.seo_title].map(c => sanitize(c)).filter(isMeaningful);

  // Address-derived: prefer p.address if present; else attempt from raw_json
  let addressLine = sanitize((p.address || '').split(',')[0] || '');
  if (!addressLine && p.raw_json) {
    addressLine = streetFromRaw(p.raw_json);
  }

  // Constructed fallback if granular fields are present separately
  if (!addressLine) {
    const constructed = sanitize([
      p.street_number, p.street_name, p.street_suffix
    ].filter(Boolean).join(' '));
    if (constructed) addressLine = constructed;
  }

  const cityState = sanitize([p.city, p.state || p.county].filter(Boolean).join(', '));

  let display = metaCandidates[0] || addressLine || cityState || p.listing_key || p.id || '';
  display = sanitize(display);
  if (!display) display = (p.listing_key || p.id || 'Property').toString();
  return display;
}
