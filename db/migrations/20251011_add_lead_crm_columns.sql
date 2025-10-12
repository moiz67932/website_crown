-- Leads table & CRM columns

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  first_name TEXT,
  last_name  TEXT,
  email      TEXT,
  phone      TEXT,
  message    TEXT,

  city       TEXT,
  state      TEXT,
  county     TEXT,
  property_id TEXT,
  page_url   TEXT,

  wants_tour BOOLEAN,
  budget_max NUMERIC,
  timeframe  TEXT,

  ms_on_page INTEGER,
  honeypot   TEXT,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,

  crm_provider TEXT,
  crm_lead_id  TEXT,
  crm_status   TEXT,
  crm_error    TEXT,

  tags TEXT[],
  score INTEGER,
  assigned_agent JSONB,
  followup_state JSONB,
  UNIQUE (email, message, property_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
