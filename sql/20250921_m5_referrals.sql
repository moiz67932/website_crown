-- Ensure uuid extension exists (Supabase usually has it enabled)
create extension if not exists "uuid-ossp";

create table if not exists referral_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  code text unique not null,
  created_at timestamptz default now()
);

create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  referred_cookie text,
  lead_id uuid,
  reward_awarded boolean default false,
  created_at timestamptz default now()
);

create table if not exists referral_rewards (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  points int not null default 0,
  reason text,
  created_at timestamptz default now()
);

create index if not exists referrals_code_idx on referrals (code);
create index if not exists referral_rewards_code_idx on referral_rewards (code);
