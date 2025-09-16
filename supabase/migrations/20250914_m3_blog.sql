-- Milestone 3 Blog & Content Schema

-- ENUMS
do $$ begin
  create type post_status as enum ('draft','review','scheduled','published','archived');
exception when duplicate_object then null; end $$;

-- POSTS
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status post_status not null default 'draft',
  city text,
  title_primary text not null,
  meta_description text,
  content_md text,                -- markdown or html-safe markdown
  hero_image_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A/B TITLE VARIANTS
create table if not exists post_title_variants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  label text not null check (label in ('A','B')),
  title text not null,
  impressions int not null default 0,
  clicks int not null default 0,
  is_winner boolean not null default false
);

-- LINK POSTS <-> PROPERTIES (assumes properties table exists)
create table if not exists post_properties (
  post_id uuid not null references posts(id) on delete cascade,
  property_id uuid not null,
  primary key (post_id, property_id)
);

-- SIMPLE PAGE VIEW LOGS
create table if not exists page_views (
  id bigserial primary key,
  path text,
  post_id uuid,
  variant text,
  referrer text,
  created_at timestamptz not null default now()
);

-- NEWSLETTER (optional future)
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

-- TRIGGER: updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
before update on posts
for each row execute function set_updated_at();

-- INDEXES
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_scheduled_at on posts(scheduled_at);
create index if not exists idx_posts_city on posts(city);
create index if not exists idx_ptv_post on post_title_variants(post_id);
create index if not exists idx_pp_post on post_properties(post_id);
