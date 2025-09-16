-- Create landing_pages table if it doesn't exist and add faqs + seo_metadata columns
create table if not exists public.landing_pages (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  page_name text not null,
  kind text,
  ai_description_html text,
  hero_image_url text,
  faqs jsonb,
  seo_metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(city, page_name)
);

-- Add columns if missing
alter table public.landing_pages add column if not exists faqs jsonb;
alter table public.landing_pages add column if not exists seo_metadata jsonb;
alter table public.landing_pages add column if not exists hero_image_url text;
alter table public.landing_pages add column if not exists updated_at timestamptz default now();

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_landing_pages_updated_at'
  ) then
    create trigger trg_landing_pages_updated_at
    before update on public.landing_pages
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Helpful indexes
create index if not exists idx_landing_pages_city_page on public.landing_pages (lower(city), lower(page_name));