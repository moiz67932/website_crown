-- Add hidden flag to properties to support admin hide/unhide and exclude from public site
alter table if exists public.properties
  add column if not exists hidden boolean default false;

-- Helpful index for public queries that exclude hidden and by status
create index if not exists idx_properties_hidden on public.properties (hidden);
create index if not exists idx_properties_status_hidden on public.properties (status, hidden);
