-- 20251004_chat_history_and_rpc.sql
-- Chat sessions/messages (auth-scoped)

create extension if not exists pgcrypto; -- for gen_random_uuid()

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text,
  last_intent text,
  dialog_state jsonb default '{}'::jsonb
);

create index if not exists idx_chat_sessions_user on public.chat_sessions(user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session on public.chat_messages(session_id, created_at);

create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end
$$ language plpgsql;

drop trigger if exists trg_chat_sessions_touch on public.chat_sessions;
create trigger trg_chat_sessions_touch before update on public.chat_sessions
for each row execute function public.touch_updated_at();

-- Search RPC: filters + pagination, with graceful fallbacks if some columns are missing
create or replace function public.search_properties_basic(
  city text,
  max_price numeric,
  min_price numeric,
  beds numeric,
  baths numeric,
  has_pool boolean,
  p_offset integer,
  p_limit integer
)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
  total_count integer;
begin
  with base as (
    select * from public.properties
    where (city is null or (exists (select 1 from information_schema.columns where table_name='properties' and column_name='city') and lower(public.properties.city) = lower(city)))
      and (max_price is null or (exists (select 1 from information_schema.columns where table_name='properties' and column_name='list_price') and public.properties.list_price <= max_price))
      and (min_price is null or (exists (select 1 from information_schema.columns where table_name='properties' and column_name='list_price') and public.properties.list_price >= min_price))
      and (beds is null or (exists (select 1 from information_schema.columns where table_name='properties' and column_name='bedrooms_total') and public.properties.bedrooms_total >= beds))
      and (baths is null or (exists (select 1 from information_schema.columns where table_name='properties' and column_name='bathrooms_total') and public.properties.bathrooms_total >= baths))
      and (
        has_pool is null
        or (
          (exists (select 1 from information_schema.columns where table_name='properties' and column_name='has_pool') and public.properties.has_pool = has_pool)
          or (has_pool = true and (exists (select 1 from information_schema.columns where table_name='properties' and column_name='features') and (public.properties.features)::text ilike '%pool%'))
        )
      )
  ), counted as (
    select count(*)::int as c from base
  ), paged as (
    select * from base
    order by coalesce(list_price, 9223372036854775807) asc nulls last
    offset coalesce(p_offset, 0)
    limit coalesce(p_limit, 6)
  )
  select c into total_count from counted;

  result := jsonb_build_object(
    'rows', (select jsonb_agg(to_jsonb(p)) from paged p),
    'total', total_count
  );
  return result;
end;
$$;
