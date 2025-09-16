-- Create post_images table and add lede + hero_image_url to posts
create extension if not exists "pgcrypto";

create table if not exists post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  url text not null,
  prompt text not null,
  position text check (position in ('hero','inline_1','inline_2','inline_3','inline_4')),
  created_at timestamptz default now()
);

alter table posts add column if not exists lede text;
alter table posts add column if not exists hero_image_url text;
