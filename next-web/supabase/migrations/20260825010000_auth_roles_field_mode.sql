-- Supabase Auth profiles and station-scoped authorization for Field Mode.
-- Public monitoring reads remain available; authenticated writes are manual-only.

do $$
begin
  create type public.jernih_user_role as enum ('viewer', 'field_operator', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.jernih_user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.station_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  station_id text not null references public.stations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, station_id)
);

alter table public.readings
  add column if not exists recorded_by uuid references public.profiles(id) on delete set null default auth.uid();

create index if not exists station_memberships_user_station_idx
  on public.station_memberships (user_id, station_id);

create index if not exists readings_recorded_by_created_at_idx
  on public.readings (recorded_by, created_at desc);

alter table public.profiles enable row level security;
alter table public.station_memberships enable row level security;

revoke all on table public.profiles from public, anon;
revoke all on table public.station_memberships from public, anon;
grant select on table public.profiles to authenticated;
grant select on table public.station_memberships to authenticated;

revoke insert, update, delete on table public.readings from anon;
revoke update, delete on table public.readings from authenticated;
grant insert on table public.readings to authenticated;

drop policy if exists "users can view their own profile" on public.profiles;
create policy "users can view their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "users can view their own station memberships" on public.station_memberships;
create policy "users can view their own station memberships"
on public.station_memberships for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "field operators can create manual readings for assigned stations" on public.readings;
create policy "field operators can create manual readings for assigned stations"
on public.readings for insert to authenticated
with check (
  (select auth.uid()) is not null
  and source = 'manual'
  and recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles profile
    where profile.id = (select auth.uid())
      and profile.role in ('field_operator', 'admin')
  )
  and (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = (select auth.uid())
        and admin_profile.role = 'admin'
    )
    or station_id in (
      select membership.station_id
      from public.station_memberships membership
      where membership.user_id = (select auth.uid())
    )
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
