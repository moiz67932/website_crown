-- Milestone 5: Referrals system (users-centric)
-- Safe/idempotent migration. Uses public.users (mapped to auth.users) in this repo.

-- 1) Extend users with referral fields
alter table if exists public.users
  add column if not exists referral_code text unique,
  add column if not exists referrer_id uuid references public.users(id) on delete set null,
  add column if not exists family_id uuid;

-- 2) Referral visits (anonymous, pre‑signup)
create table if not exists public.referral_visits (
  id uuid primary key default gen_random_uuid(),
  referrer_code text not null,
  cc_session uuid,
  landing_path text,
  utm jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists idx_referral_visits_code on public.referral_visits (referrer_code);

-- 3) Referral events (stateful milestones)
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.users(id) on delete set null,
  referee_id uuid references public.users(id) on delete set null,
  cc_session uuid,               -- for anon history before merge
  kind text not null check (kind in ('visit','signup','lead','appointment','closing')),
  meta jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_referral_events_referrer on public.referral_events (referrer_id);
create index if not exists idx_referral_events_referee on public.referral_events (referee_id);

-- Prevent duplicate signup events per referee_id
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'uniq_referral_signup_per_user'
  ) then
    execute 'create unique index uniq_referral_signup_per_user on public.referral_events (referee_id) where kind = ''signup'' and referee_id is not null';
  end if;
end $$;

-- 4) Rewards ledger
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade, -- referrer who earns
  event_id uuid references public.referral_events(id) on delete set null,
  points int not null default 0,
  reason text,
  status text not null default 'pending',  -- pending|approved|denied|paid
  created_at timestamptz default now()
);
create index if not exists idx_referral_rewards_user on public.referral_rewards (user_id);

-- 5) Redemption requests
create table if not exists public.referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  points int not null,
  status text not null default 'requested', -- requested|approved|denied|paid
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_referral_redemptions_user on public.referral_redemptions (user_id);

-- 6) Family groups
create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.users(id) on delete cascade,
  invite_code text unique,
  created_at timestamptz default now()
);

create table if not exists public.family_members (
  family_id uuid references public.family_groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null default 'member', -- owner|member
  joined_at timestamptz default now(),
  primary key (family_id, user_id)
);
create index if not exists idx_family_members_user on public.family_members (user_id);

-- 7) Generate referral_code for existing users
update public.users u
set referral_code = coalesce(u.referral_code, left(encode(sha256((u.id::text || '-seed')::bytea),'hex'),8))
where u.referral_code is null;

-- 8) Merge function: move anon events to authenticated user
create or replace function public.merge_referral_session(p_user_id uuid, p_cc_session uuid)
returns void
language plpgsql
as $fn$
begin
  if p_user_id is null or p_cc_session is null then
    return;
  end if;
  -- attach events
  update public.referral_events
  set referee_id = p_user_id
  where cc_session = p_cc_session and (referee_id is null or referee_id = p_user_id);
end;
$fn$;

-- 9) RLS policies (enable; allow simple self-access; admins via future function)
alter table if exists public.referral_events enable row level security;
alter table if exists public.referral_rewards enable row level security;
alter table if exists public.referral_redemptions enable row level security;
alter table if exists public.family_groups enable row level security;
alter table if exists public.family_members enable row level security;

-- Events: users can view events where they are referee or referrer
do $$
begin
  if not exists (select 1 from pg_policies where tablename='referral_events' and policyname='events_self_read') then
    execute 'create policy events_self_read on public.referral_events for select using ( auth.uid() = referrer_id or auth.uid() = referee_id )';
  end if;
end
$$;

-- 10) Optional compatibility: code-based referral tables (apply only if present)
-- The following mirrors policies you executed manually for tables:
--   public.referral_codes, public.referrals, public.referral_rewards (code-linked)
-- All blocks are idempotent and guarded by relation/column existence checks.

-- Enable RLS on legacy/code-based tables if they exist
do $$
begin
  if to_regclass('public.referral_codes') is not null then
    execute 'alter table if exists public.referral_codes enable row level security';
  end if;
  if to_regclass('public.referral_rewards') is not null then
    execute 'alter table if exists public.referral_rewards enable row level security';
  end if;
  if to_regclass('public.referrals') is not null then
    execute 'alter table if exists public.referrals enable row level security';
  end if;
end
$$;

-- codes_self_read: allow owner (by user_id) to read own codes
do $$
begin
  if to_regclass('public.referral_codes') is not null and
     not exists (
       select 1 from pg_policies where schemaname='public' and tablename='referral_codes' and policyname='codes_self_read'
     ) then
    execute 'create policy codes_self_read on public.referral_codes for select using ( user_id = auth.uid() )';
  end if;
end
$$;

-- rewards_self_read: allow read if reward.code belongs to current user via referral_codes
do $$
begin
  if to_regclass('public.referral_rewards') is not null and
     exists (
       select 1 from information_schema.columns
       where table_schema='public' and table_name='referral_rewards' and column_name='code'
     ) and
     to_regclass('public.referral_codes') is not null and
     not exists (
       select 1 from pg_policies where schemaname='public' and tablename='referral_rewards' and policyname='rewards_self_read'
     ) then
    execute 'create policy rewards_self_read on public.referral_rewards for select using ( exists ( select 1 from public.referral_codes c where c.code = referral_rewards.code and c.user_id = auth.uid() ) )';
  end if;
end
$$;

-- referrals_self_read: allow read if referral.code belongs to current user via referral_codes
do $$
begin
  if to_regclass('public.referrals') is not null and
     exists (
       select 1 from information_schema.columns
       where table_schema='public' and table_name='referrals' and column_name='code'
     ) and
     to_regclass('public.referral_codes') is not null and
     not exists (
       select 1 from pg_policies where schemaname='public' and tablename='referrals' and policyname='referrals_self_read'
     ) then
    execute 'create policy referrals_self_read on public.referrals for select using ( exists ( select 1 from public.referral_codes c where c.code = referrals.code and c.user_id = auth.uid() ) )';
  end if;
end
$$;

-- Rewards: users can read their own
do $$
begin
  if not exists (select 1 from pg_policies where tablename='referral_rewards' and policyname='rewards_self_read') then
    execute 'create policy rewards_self_read on public.referral_rewards for select using ( auth.uid() = user_id )';
  end if;
end
$$;

-- Redemptions: users can select & insert their own; updates by admins handled via service key/APIs
do $$
begin
  if not exists (select 1 from pg_policies where tablename='referral_redemptions' and policyname='redemptions_self_read') then
    execute 'create policy redemptions_self_read on public.referral_redemptions for select using ( auth.uid() = user_id )';
  end if;
  if not exists (select 1 from pg_policies where tablename='referral_redemptions' and policyname='redemptions_self_insert') then
    execute 'create policy redemptions_self_insert on public.referral_redemptions for insert with check ( auth.uid() = user_id )';
  end if;
end
$$;

-- Families: members can read their group/membership
do $$
begin
  if not exists (select 1 from pg_policies where tablename='family_groups' and policyname='families_member_read') then
    execute 'create policy families_member_read on public.family_groups for select using ( exists (select 1 from public.family_members m where m.family_id = id and m.user_id = auth.uid()) )';
  end if;
  if not exists (select 1 from pg_policies where tablename='family_members' and policyname='family_members_self_read') then
    execute 'create policy family_members_self_read on public.family_members for select using ( user_id = auth.uid() or exists (select 1 from public.family_members m2 where m2.family_id = family_id and m2.user_id = auth.uid()) )';
  end if;
end
$$;
