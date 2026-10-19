-- Admin access for the /admin page.
-- Run once in Supabase -> SQL Editor (after schema.sql). Safe to run again.
--
-- Idea: the public can still only READ. Writing (add/remove/reorder/rename photos and collections) is allowed only
-- for a signed-in user whose email is on the admin allowlist below. The rules live in the database, so they hold
-- even if someone finds the /admin page or the website's public key.

-- 1. The allowlist. RLS is on and there is deliberately NO policy: nobody can read or edit it from the website.
--    (You add your email to it from the dashboard or with the secret key.)
create table if not exists public.admin_emails (
  email text primary key
);
alter table public.admin_emails enable row level security;

-- 2. "Is the signed-in user an admin?"
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. Admins may add / edit / remove collections and designs.
drop policy if exists "Admin add collections" on public.collections;
create policy "Admin add collections" on public.collections for insert to authenticated with check (public.is_admin());
drop policy if exists "Admin edit collections" on public.collections;
create policy "Admin edit collections" on public.collections for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin remove collections" on public.collections;
create policy "Admin remove collections" on public.collections for delete to authenticated using (public.is_admin());

drop policy if exists "Admin add designs" on public.designs;
create policy "Admin add designs" on public.designs for insert to authenticated with check (public.is_admin());
drop policy if exists "Admin edit designs" on public.designs;
create policy "Admin edit designs" on public.designs for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin remove designs" on public.designs;
create policy "Admin remove designs" on public.designs for delete to authenticated using (public.is_admin());

-- 4. Admins may upload / replace / delete photos in the 'nails' bucket (viewing stays public).
drop policy if exists "Admin see photos" on storage.objects;
create policy "Admin see photos" on storage.objects for select to authenticated using (bucket_id = 'nails' and public.is_admin());
drop policy if exists "Admin upload photos" on storage.objects;
create policy "Admin upload photos" on storage.objects for insert to authenticated with check (bucket_id = 'nails' and public.is_admin());
drop policy if exists "Admin replace photos" on storage.objects;
create policy "Admin replace photos" on storage.objects for update to authenticated using (bucket_id = 'nails' and public.is_admin());
drop policy if exists "Admin delete photos" on storage.objects;
create policy "Admin delete photos" on storage.objects for delete to authenticated using (bucket_id = 'nails' and public.is_admin());
