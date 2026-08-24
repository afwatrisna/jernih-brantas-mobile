# Supabase integration

The authorized Supabase project is `Jernih` (`xqkjwvlkgicmqgejikxr`). The
dashboard has public, read-only access to `stations` and `readings`. Sensor or
trusted-service ingestion remains restricted to the server route that validates
`JERNIH_INGEST_API_KEY` before using the server-only Supabase service key.

## Environment configuration

Copy `.env.local.example` to `.env.local` for local development. Configure the
same values in the Vercel project environment settings before deploying. Keep
`SUPABASE_SERVICE_ROLE_KEY` and `JERNIH_INGEST_API_KEY` server-only; never add
either one to a `NEXT_PUBLIC_` variable or commit it to Git.

## Current boundary

The dashboard reads Supabase history and retains clearly-labelled simulation as
a fallback. Browser-side manual readings now use Supabase Auth and RLS directly:
the browser has no ingest key and cannot create `sensor` or `simulation` rows.

| Role | Field Mode permission |
|---|---|
| `viewer` | Can view public monitoring data but cannot save a manual reading. |
| `field_operator` | Can save a `manual` reading only for an assigned station. |
| `admin` | Can save a `manual` reading for any station. |

The migration `20260825010000_auth_roles_field_mode.sql` creates `profiles`,
`station_memberships`, and `readings.recorded_by`. New Supabase Auth users
receive a `viewer` profile through a trigger; browser users cannot promote their
own role or assign their own stations.

## Production activation checklist

1. In **Supabase Dashboard → Authentication → URL Configuration**, add the
   production redirect `https://jernih-brantas-mobile.vercel.app/` and the local
   redirect `http://localhost:3000/`. Add any other approved production domain
   that will host the Next.js dashboard.
2. In **Authentication → Providers**, enable the intended staff sign-in method.
   The current interface sends a passwordless email magic link.
3. Have the first staff member sign in once. Their profile will be created with
   the `viewer` role. An administrator must then assign `field_operator` or
   `admin` in the Supabase Dashboard/SQL editor and add the necessary
   `station_memberships` records.
4. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `JERNIH_INGEST_API_KEY` in Vercel, then
   redeploy from the `next-web` root directory.

> The two existing `TEST ONLY` manual readings are development records, not
> official environmental measurements. Delete or archive them before live
> monitoring begins.
