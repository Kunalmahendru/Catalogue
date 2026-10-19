-- Run this in Supabase -> SQL Editor.

create table if not exists public.designs (
  id          text primary key,                -- url-friendly slug, e.g. 'pink-chrome'
  title       text not null,
  category    text not null,
  description text not null default '',
  image_url   text,                            -- public URL from Supabase Storage
  palette     text[] not null default '{#f9a8d4,#c4b5fd}',
  price       integer,                         -- null = "DM for price"
  duration    text,
  tags        text[] not null default '{}',
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Public site: anyone may read, only you (via dashboard / service role) may write.
alter table public.designs enable row level security;

drop policy if exists "Public read designs" on public.designs;
create policy "Public read designs"
  on public.designs for select
  using (true);

-- Photos: create a PUBLIC storage bucket named 'nails' in Storage,
-- upload your pictures, and paste each file's public URL into designs.image_url.
