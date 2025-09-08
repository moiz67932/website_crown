export type UTM = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
};

export function parseUTMFromURL(url: URL): UTM {
  const q = url.searchParams;
  return {
    source: q.get('utm_source'),
    medium: q.get('utm_medium'),
    campaign: q.get('utm_campaign'),
    content: q.get('utm_content'),
    term: q.get('utm_term'),
    gclid: q.get('gclid'),
    fbclid: q.get('fbclid'),
  };
}
