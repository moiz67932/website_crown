export type LeadPayload = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
  city?: string;
  state?: string;
  county?: string;
  budgetMin?: number;
  budgetMax?: number;
  beds?: number | string;   // "3+"
  baths?: number | string;  // "2+"
  propertyType?: string;
  pageUrl?: string;
  referer?: string;
  userAgent?: string;
  ip?: string;
  isCashBuyer?: boolean;
  wantsTour?: boolean;
  timeframe?: 'now' | '30d' | '90d' | 'later';
  contactPreference?: 'sms' | 'email' | 'phone' | 'any';
  tags?: string[];
  source?: string; // marketing source
  campaign?: string | null;
  medium?: string | null;
  channel?: string | null;
  content?: string | null;
  term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  score?: number; // computed locally
};
