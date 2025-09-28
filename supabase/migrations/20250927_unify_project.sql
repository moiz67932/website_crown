-- Migration: Unify Supabase project auth/users relationship
-- Date: 2025-09-27
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key,
  email text unique,
  referral_code text unique,
  referrer_id uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

do $$
begin
  alter table public.users
    drop constraint if exists users_id_fkey,
    add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;
exception when others then null; -- tolerate re-run
end$$;

create or replace function public.ensure_profile_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$fn$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_auth_users_after_insert_profile') then
    create trigger trg_auth_users_after_insert_profile
    after insert on auth.users
    for each row execute function public.ensure_profile_row();
  end if;
end$$;

alter table if exists public.users enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='users' and policyname='users_self_read') then
    execute 'create policy users_self_read on public.users for select using (id = auth.uid())';
  end if;
end$$;
