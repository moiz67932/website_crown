-- Chat memory tables (24h)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lang text default 'en',
  started_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  session_id uuid references chat_sessions(id) on delete cascade,
  role text check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists chat_summaries (
  session_id uuid primary key references chat_sessions(id) on delete cascade,
  summary text,
  updated_at timestamptz default now()
);

-- lead capture and appointment scheduling
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text, email text, phone text,
  source text, meta jsonb,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  property_id text,
  "when" timestamptz,
  name text, email text, phone text,
  status text default 'requested',
  created_at timestamptz default now()
);

-- Optional feedback table
create table if not exists chat_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid,
  rating int,
  note text,
  created_at timestamptz default now()
);

-- Cleanup query (manual run): purge sessions older than 24h
-- delete from chat_sessions where expires_at is not null and now() > expires_at;
