-- Applied to project xqkjwvlkgicmqgejikxr through the Supabase integration.
-- Public dashboards can only read stations and readings. Trusted server routes
-- use the service role after validating the dedicated ingest key.
alter table public.stations enable row level security;
alter table public.readings enable row level security;

revoke all on table public.stations from anon, authenticated;
revoke all on table public.readings from anon, authenticated;
grant select on table public.stations to anon, authenticated;
grant select on table public.readings to anon, authenticated;

create index if not exists readings_station_created_at_idx
  on public.readings (station_id, created_at desc);

do $$ begin
  alter publication supabase_realtime add table public.readings;
exception when duplicate_object then null;
end $$;
