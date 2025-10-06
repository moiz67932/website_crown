-- 20251004_chat_search_indices.sql
-- Safe indices for properties search and chat performance. Uses IF EXISTS/IF NOT EXISTS guards.

-- Enable pg_trgm for trigram search if not already
create extension if not exists pg_trgm;

-- Properties: city lookup (lower)
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='city') then
    execute 'create index if not exists idx_properties_city_lower on public.properties (lower(city))';
  end if;
end $$;

-- Properties: price filtering
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='list_price') then
    execute 'create index if not exists idx_properties_list_price on public.properties (list_price)';
  end if;
end $$;

-- Properties: quick pool flag if present
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='has_pool') then
    execute 'create index if not exists idx_properties_has_pool on public.properties (has_pool)';
  end if;
end $$;

-- Properties: trigram search on address if column exists
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='address') then
    execute 'create index if not exists idx_properties_address_trgm on public.properties using gin (address gin_trgm_ops)';
  end if;
end $$;
