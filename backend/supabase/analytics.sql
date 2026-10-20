-- Visit and click statistics for the /stats page.
-- Run once in Supabase -> SQL Editor (after schema.sql and admin.sql). Safe to run again.
--
-- What is stored: only an event type, a random anonymous id made by the visitor's browser, which design (for booking
-- clicks) and where the visit came from (the referring site's name). No names, no IP addresses.
-- Who can do what: anyone visiting the site can ADD an event; nobody can read the raw rows from the website; only an
-- admin can read the totals, through get_stats().

create table if not exists public.events (
  id         bigint generated always as identity primary key,
  type       text not null check (type in ('visit', 'whatsapp', 'instagram', 'call')),
  visitor    text not null check (char_length(visitor) between 8 and 64),
  design     text check (char_length(design) <= 80),    -- design id, for "Book this look" clicks
  source     text check (char_length(source) <= 60),    -- visits: referring site; clicks: which button area
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_type_created_idx on public.events (type, created_at desc);

alter table public.events enable row level security;

drop policy if exists "Anyone can record an event" on public.events;
create policy "Anyone can record an event"
  on public.events for insert to anon, authenticated
  with check (true);
-- No select / update / delete policy on purpose: the raw events can't be read or changed from the website.

-- Totals for the admin only.
create or replace function public.get_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  with windows(label, since) as (
    values ('hour', now() - interval '1 hour'),
           ('day', now() - interval '24 hours'),
           ('week', now() - interval '7 days'),
           ('month', now() - interval '30 days'),
           ('all', '-infinity'::timestamptz)
  )
  select json_build_object(
    'generated_at', now(),
    'windows', (
      select json_object_agg(w.label, json_build_object(
        'visits',    (select count(*) from events e where e.type = 'visit' and e.created_at >= w.since),
        'visitors',  (select count(distinct e.visitor) from events e where e.type = 'visit' and e.created_at >= w.since),
        'whatsapp',  (select count(*) from events e where e.type = 'whatsapp' and e.created_at >= w.since),
        'instagram', (select count(*) from events e where e.type = 'instagram' and e.created_at >= w.since),
        'call',      (select count(*) from events e where e.type = 'call' and e.created_at >= w.since)
      )) from windows w
    ),
    'hourly', (
      select json_agg(json_build_object('hour', h.hour, 'visits', coalesce(c.n, 0)) order by h.hour)
      from generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') as h(hour)
      left join (
        select date_trunc('hour', created_at) as hour, count(*) as n
        from events
        where type = 'visit' and created_at >= date_trunc('hour', now()) - interval '23 hours'
        group by 1
      ) c on c.hour = h.hour
    ),
    'top_designs', (
      select coalesce(json_agg(t), '[]'::json) from (
        select design, count(*) as clicks
        from events
        where type = 'whatsapp' and design is not null and created_at >= now() - interval '30 days'
        group by design order by clicks desc limit 6
      ) t
    ),
    'sources', (
      select coalesce(json_agg(t), '[]'::json) from (
        select coalesce(nullif(source, ''), 'direct') as source, count(*) as visits
        from events
        where type = 'visit' and created_at >= now() - interval '30 days'
        group by 1 order by visits desc limit 6
      ) t
    )
  ) into result;

  return result;
end;
$$;
revoke all on function public.get_stats() from public, anon;
grant execute on function public.get_stats() to authenticated;

-- Make the API notice the new table and function straight away.
notify pgrst, 'reload schema';
