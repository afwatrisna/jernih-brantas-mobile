# Supabase integration

The authorized Supabase project is `Jernih` (`xqkjwvlkgicmqgejikxr`). The
dashboard has public, read-only access to `stations` and `readings`; writes are
restricted to trusted server routes that validate `JERNIH_INGEST_API_KEY` before
using the server-only Supabase service key.

## Environment configuration

Copy `.env.local.example` to `.env.local` for local development. Configure the
same values in the Vercel project environment settings before deploying. Keep
`SUPABASE_SERVICE_ROLE_KEY` and `JERNIH_INGEST_API_KEY` server-only; never add
either one to a `NEXT_PUBLIC_` variable or commit it to Git.

## Current boundary

The integration package establishes read access, realtime subscription support,
and the protected sensor-ingestion route. The existing dashboard remains in
local demo mode until the next phase integrates `useSupabaseReadings` and
Supabase Auth into the page-level data flow.
