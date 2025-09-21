create table if not exists errors (
  id bigserial primary key,
  path text,
  message text,
  stack text,
  created_at timestamptz default now()
);
create index if not exists errors_created_idx on errors (created_at desc);

create table if not exists api_logs (
  id bigserial primary key,
  path text,
  ip text,
  status int,
  created_at timestamptz default now()
);
create index if not exists api_logs_path_created_idx on api_logs (path, created_at desc);
