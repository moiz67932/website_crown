-- Milestone 3: Content System & Embeddings
-- Idempotent migration: enable pgvector, add columns, tables, policies, and indexes

-- Extensions
create extension if not exists vector;
create extension if not exists pgcrypto;

-- POSTS: add content marketing fields
alter table public.posts add column if not exists category text;
alter table public.posts add column if not exists tags text[];
-- scheduled_at is already present in earlier migration; keep idempotent
alter table public.posts add column if not exists author text;
alter table public.posts add column if not exists generated boolean default false;
-- Add embedding column with 1536 dims for OpenAI text-embedding-3-small
do $$ begin
  alter table public.posts add column embedding vector(1536);
exception when duplicate_column then null; end $$;

-- PROPERTIES: add embedding for retrieval-augmented content
do $$ begin
  alter table public.properties add column embedding vector(1536);
exception when undefined_table then null; when duplicate_column then null; end $$;

-- COMMENTS with RLS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text,
  body text not null,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table public.comments enable row level security;
create policy if not exists read_approved_comments on public.comments
  for select using (status = 'approved');
create policy if not exists insert_anyone_comment on public.comments
  for insert with check (true);

-- POST_PROPERTIES junction with score
create table if not exists public.post_properties (
  post_id uuid not null references public.posts(id) on delete cascade,
  property_id uuid not null,
  score numeric,
  primary key (post_id, property_id)
);
-- If table existed without score, add it
alter table public.post_properties add column if not exists score numeric;

-- PAGE_VIEWS: extra columns
alter table if exists public.page_views add column if not exists variant text;
alter table if exists public.page_views add column if not exists referrer text;
alter table if exists public.page_views add column if not exists ua text;
-- Helpful index for analytics
create index if not exists idx_page_views_post_created on public.page_views(post_id, created_at);

-- Vector indexes for similarity search (IVFFLAT with cosine)
-- Note: requires analyze to be effective after population
do $$ begin
  execute 'create index if not exists idx_posts_embedding_ivfflat on public.posts using ivfflat (embedding vector_cosine_ops) with (lists=100)';
exception when undefined_object then null; end $$;
do $$ begin
  execute 'create index if not exists idx_properties_embedding_ivfflat on public.properties using ivfflat (embedding vector_cosine_ops) with (lists=100)';
exception when undefined_table then null; when undefined_object then null; end $$;

-- Optional: helper RPCs for nearest neighbors (easier to call from PostgREST)
create or replace function public.match_properties_by_embedding(p_city text, query vector(1536), match_count int default 10)
returns table (property_id uuid, distance real) language sql stable as $$
  select id as property_id, (embedding <=> query)::real as distance
  from public.properties
  where city = p_city and embedding is not null
  order by embedding <=> query
  limit match_count
$$;

create or replace function public.match_posts_by_embedding(p_city text, p_status text, p_exclude uuid, query vector(1536), match_count int default 10)
returns table (post_id uuid, distance real) language sql stable as $$
  select id as post_id, (embedding <=> query)::real as distance
  from public.posts
  where city = p_city and status = p_status and embedding is not null and (p_exclude is null or id <> p_exclude)
  order by embedding <=> query
  limit match_count
$$;

-- Analytics: views by day
create or replace function public.views_by_day()
returns table (day text, views bigint) language sql stable as $$
  select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*) as views
  from public.page_views
  group by 1
  order by 1
$$;
