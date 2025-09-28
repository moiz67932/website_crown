-- SIMPLE REFERRALS: code-entry only (signup+lead), no URL/cookie tracking, no visits.
-- Date: 2025-09-27

-- 0) Extensions
create extension if not exists pgcrypto;

-- 1) Existing table: referral_codes (add counters)
alter table if exists public.referral_codes
  add column if not exists signup_count int not null default 0,
  add column if not exists lead_count   int not null default 0;

-- 2) Signups table (idempotent per (referrer_code, referred_user_id))
create table if not exists public.referral_signups (
  id uuid primary key default gen_random_uuid(),
  referrer_code text not null,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(referrer_code, referred_user_id)
);

create index if not exists idx_referral_signups_code on public.referral_signups (referrer_code);
create index if not exists idx_referral_signups_referred on public.referral_signups (referred_user_id);

-- 3) Leads table (attributed by code; minimal metadata)
create table if not exists public.referral_leads (
  id uuid primary key default gen_random_uuid(),
  referrer_code text not null,
  lead_name text,
  lead_email text,
  lead_phone text,
  property_id text,
  created_at timestamptz default now()
);

create index if not exists idx_referral_leads_code on public.referral_leads (referrer_code);
create index if not exists idx_referral_leads_created on public.referral_leads (created_at);

-- 3b) Helper functions for atomic counter increments
create or replace function public.increment_referral_signup(p_code text)
returns void language sql as $$
  update public.referral_codes set signup_count = signup_count + 1 where code = p_code;
$$;

create or replace function public.increment_referral_lead(p_code text)
returns void language sql as $$
  update public.referral_codes set lead_count = lead_count + 1 where code = p_code;
$$;

-- 4) (Optional) Retire visits (stop writing; optionally drop table if you want cleanliness)
-- OPTION A (non-destructive): keep existing data, application code stops writing.
-- OPTION B (cleanup): uncomment to drop
-- drop table if exists public.referral_visits cascade;

-- 5) RLS: Enable and keep reads safe. Writes happen via server (service role).
alter table if exists public.referral_codes enable row level security;
alter table if exists public.referral_signups enable row level security;
alter table if exists public.referral_leads enable row level security;

-- Drop old policies if they exist (ignore errors)
do $$
begin
  if exists (select 1 from pg_policies where tablename='referral_codes' and policyname='codes_self_read') then
    execute 'drop policy codes_self_read on public.referral_codes';
  end if;
  if exists (select 1 from pg_policies where tablename='referral_leads' and policyname='leads_self_read') then
    execute 'drop policy leads_self_read on public.referral_leads';
  end if;
  if exists (select 1 from pg_policies where tablename='referral_signups' and policyname='signups_self_read') then
    execute 'drop policy signups_self_read on public.referral_signups';
  end if;
end
$$;

-- Users may read only their own code row(s)
create policy codes_self_read on public.referral_codes
  for select using (user_id = auth.uid());

-- Users may read signups that belong to their code(s)
create policy signups_self_read on public.referral_signups
  for select using (
    exists (
      select 1 from public.referral_codes c
      where c.code = referral_signups.referrer_code
        and c.user_id = auth.uid()
    )
  );

-- Users may read leads that belong to their code(s)
create policy leads_self_read on public.referral_leads
  for select using (
    exists (
      select 1 from public.referral_codes c
      where c.code = referral_leads.referrer_code
        and c.user_id = auth.uid()
    )
  );

-- End migration