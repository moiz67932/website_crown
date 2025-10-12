export type LeadPayload = {
  // Identity
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;

  // Message & context
  message?: string;
  city?: string;
  state?: string;
  county?: string;
  streetAddress?: string;
  zipCode?: string;

  // Property & page context
  propertyId?: string;
  pageUrl?: string;
  tags?: string[];

  // Preferences
  budgetMin?: number;
  budgetMax?: number;
  beds?: number | string;   // "3+"
  baths?: number | string;  // "2+"
  propertyType?: string;
  wantsTour?: boolean;
  timeframe?: 'now' | '30d' | '90d' | 'later' | string;
  contactPreference?: 'sms' | 'email' | 'phone' | 'any' | string;

  // Anti-bot hints
  __top?: number;           // ms on page
  company?: string | null;  // honeypot field must be empty

  // Source tracking (normalized)
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;

  // Legacy/compat fields (kept for current code paths)
  referer?: string;
  userAgent?: string;
  ip?: string;
  isCashBuyer?: boolean;
  source?: string | null; // marketing source (legacy)
  campaign?: string | null;
  medium?: string | null;
  channel?: string | null;
  content?: string | null;
  term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;

  // Computed
  score?: number; // computed locally
  assignedAgent?: { name: string; email?: string } | null;
};

export type AssignedAgent = { name: string; email?: string };

export type FollowupSchedule = {
  scheduled: { type: 't1h' | 't24h'; at: string }[];
  sent: { type: 't1h' | 't24h'; at: string }[];
};
