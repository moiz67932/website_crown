-- Admin Discovery, Blog Types, SEO, Bulk Jobs

-- discovered_topics table
create table if not exists public.discovered_topics (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  source text default 'google_trends',
  url text,
  traffic text,
  created_at timestamptz default now()
);
create index if not exists discovered_topics_created_idx on public.discovered_topics(created_at desc);

-- posts extensions
alter table public.posts add column if not exists post_type text default 'general';
alter table public.posts add column if not exists seo_score int;
alter table public.posts add column if not exists reviewer text;
create index if not exists posts_post_type_idx on public.posts(post_type);

-- extend status enum (allow multiple values gracefully)
do $$ begin
  alter type post_status add value if not exists 'in_review';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type post_status add value if not exists 'approved';
exception when duplicate_object then null; end $$;

-- bulk_jobs table
create table if not exists public.bulk_jobs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text default 'running',
  logs text
);
