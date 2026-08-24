# Production activation status

## Public Vercel check — 2026-08-24

The public site at `https://jernih-brantas-mobile.vercel.app/` loads the current authenticated Field Mode interface. Its signed-out access panel correctly keeps manual saving disabled, but shows **“Konfigurasi Supabase browser belum tersedia.”**

This confirms that the deployed project still lacks at least one required public environment value, `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The server-only values are also required for `/api/readings` and must remain private. No staff login link was sent and no official water-quality record was created during this check.
