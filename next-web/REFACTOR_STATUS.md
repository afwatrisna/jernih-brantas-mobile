# Next Web Architecture Refactor

Branch: `refactor/next-web-architecture-v1`

## Completed

- Domain types extracted from the page component.
- NTU classification isolated.
- Alert/anomaly rules isolated.
- Simulation, storage, analytics, measurement and formatting helpers isolated.
- Data-trust logic isolated.
- API client/contracts boundary established.
- Monitoring feature boundary established.
- Production build no longer includes a Vitest test-runner dependency or test globals.

## Remaining integration work

The legacy `src/app/page.tsx` is intentionally kept as the compatibility UI during the migration. The next integration step is to migrate its sections incrementally to feature components and hooks, preserving the existing UX and validation behavior.

## Validation note

Validated locally on 2026-08-24 with `pnpm install --frozen-lockfile`, `pnpm lint`, and `pnpm build`. This branch currently has no `test` script; add a dedicated test runner only when its configuration is intentionally included in the deployment workflow.
