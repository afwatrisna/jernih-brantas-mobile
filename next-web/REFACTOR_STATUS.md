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
- Unit-test foundation added with Vitest.

## Remaining integration work

The legacy `src/app/page.tsx` is intentionally kept as the compatibility UI during the migration. The next integration step is to migrate its sections incrementally to feature components and hooks, preserving the existing UX and validation behavior.

## Validation note

This branch has not been executed in a local CI runner by the GitHub connector. Run `pnpm install`, `pnpm lint`, `pnpm test`, and `pnpm build` from `next-web/` before merging.
