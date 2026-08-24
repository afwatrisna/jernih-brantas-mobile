# Local runtime validation

**Validation scope:** initial dashboard render after the Supabase foundation integration.

| Check | Result |
|---|---|
| Runtime | `pnpm exec next start -p 3003` started successfully. |
| Initial page | The dashboard loaded at the temporary local address, including the five station selectors and Monitor view. |
| Browser console | No console messages or runtime errors were reported after the initial render. |
| Local-first behavior | The dashboard correctly identified its displayed values as **SIMULASI** and local-first demo data. |

The local server emitted a Next.js warning that the sandbox shell has a non-standard `NODE_ENV` value. This is an environment warning, not a dashboard runtime error; the production build had already completed successfully.
