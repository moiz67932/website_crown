-- Legacy bridge for public.referrals to support signup attribution and dashboards
-- Idempotent: safe to run multiple times

-- 1) Columns (if table exists)
do $$
begin
  if to_regclass('public.referrals') is not null then
    execute 'alter table public.referrals
      add column if not exists referrer_user_id uuid references public.users(id) on delete set null,
      add column if not exists referred_user_id uuid references public.users(id) on delete set null,
      add column if not exists event_kind text default ''signup'',
      add column if not exists utm jsonb default ''{}''::jsonb';
  end if;
end $$;

-- 2) Check constraint for event_kind
do $$
begin
  if to_regclass('public.referrals') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'referrals_event_kind_check'
    ) then
      execute 'alter table public.referrals add constraint referrals_event_kind_check check (event_kind in (''visit'',''signup'',''lead'',''appointment'',''closing''))';
    end if;
  end if;
end $$;

-- 3) Helpful indexes
do $$
begin
  if to_regclass('public.referrals') is not null then
    if not exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_referrals_referrer_kind_created') then
      execute 'create index idx_referrals_referrer_kind_created on public.referrals (referrer_user_id, event_kind, created_at desc)';
    end if;
    if not exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_referrals_code') then
      execute 'create index idx_referrals_code on public.referrals (code)';
    end if;
  end if;
end $$;

-- 4) Unique index to ensure one signup per (referrer,referred)
do $$
begin
  if to_regclass('public.referrals') is not null then
    if not exists (select 1 from pg_indexes where schemaname='public' and indexname='uniq_referrals_signup_pair') then
      execute 'create unique index uniq_referrals_signup_pair on public.referrals (referrer_user_id, referred_user_id, event_kind) where event_kind = ''signup'' and referrer_user_id is not null and referred_user_id is not null';
    end if;
  end if;
end $$;

do $do$
begin
  if to_regclass('public.referrals') is not null then
    execute $$create or replace function public.insert_signup_referral()
    returns trigger
    language plpgsql
    as $fn$
    declare
      ref_code text;
    begin
      if new.referrer_id is null then
        return new;
      end if;
      select referral_code into ref_code from public.users where id = new.referrer_id;
      if ref_code is null then
        return new;
      end if;
      insert into public.referrals (code, referrer_user_id, referred_user_id, event_kind)
      values (ref_code, new.referrer_id, new.id, 'signup')
      on conflict on constraint uniq_referrals_signup_pair do nothing;
      return new;
    end;
    $fn$;$$;
    if not exists (select 1 from pg_trigger where tgname = 'trg_users_after_insert_referral') then
      execute 'create trigger trg_users_after_insert_referral after insert on public.users for each row execute function public.insert_signup_referral()';
    end if;
  end if;
end $do$;

-- 6) RLS for legacy table: enable and allow referrers to read their own rows
do $$
begin
  if to_regclass('public.referrals') is not null then
    execute 'alter table public.referrals enable row level security';
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='referrals' and policyname='referrals_select_own'
    ) then
      execute 'create policy referrals_select_own on public.referrals for select using (referrer_user_id = auth.uid())';
    end if;
  end if;
end $$;
