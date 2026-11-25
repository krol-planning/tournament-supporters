-- Run in Supabase SQL Editor. Public viewers can read ONLY rows explicitly published here.
create table if not exists public.seven_broadcast (
  event_id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.seven_broadcast enable row level security;
revoke all on public.seven_broadcast from anon, authenticated;
grant select on public.seven_broadcast to anon, authenticated;
grant insert, update on public.seven_broadcast to authenticated;
drop policy if exists seven_public_read on public.seven_broadcast;
create policy seven_public_read on public.seven_broadcast for select to anon,authenticated using (true);
drop policy if exists seven_owner_insert on public.seven_broadcast;
create policy seven_owner_insert on public.seven_broadcast for insert to authenticated with check (owner_id=auth.uid());
drop policy if exists seven_owner_update on public.seven_broadcast;
create policy seven_owner_update on public.seven_broadcast for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
