-- Run this once in Supabase -> SQL Editor -> New query -> Run.
-- Safe to run again: it only creates what is missing.

-- 1. Collections (the rows you see on the site, in this order)
create table if not exists public.collections (
  name        text primary key,
  description text not null default '',
  sort_order  integer not null default 0
);

-- 2. Designs (one row per photo)
create table if not exists public.designs (
  id          text primary key,                     -- e.g. 'photo-070'
  title       text not null,
  collection  text not null references public.collections(name) on update cascade,
  description text not null default '',
  image       text not null,                        -- file name, e.g. 'nail-070.jpg' (in Storage: thumbs/ and view/)
  price       integer,                              -- null = no price shown
  tags        text[] not null default '{}',
  featured    boolean not null default false,       -- shows the "Fave" badge
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists designs_collection_idx on public.designs (collection, sort_order);

-- 3. Security: the public can only READ. Writes need the secret key (dashboard / import script).
alter table public.collections enable row level security;
alter table public.designs enable row level security;

drop policy if exists "Public read collections" on public.collections;
create policy "Public read collections" on public.collections for select using (true);

drop policy if exists "Public read designs" on public.designs;
create policy "Public read designs" on public.designs for select using (true);

-- 4. Photo storage: a public bucket named 'nails' (anyone can view, only the secret key can upload)
insert into storage.buckets (id, name, public)
values ('nails', 'nails', true)
on conflict (id) do update set public = true;
