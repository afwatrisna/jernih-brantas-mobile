# Next Web Architecture v1

## Boundaries

- `src/app`: routing and page composition only.
- `src/features`: product features and feature-level UI.
- `src/hooks`: React lifecycle/state adapters.
- `src/lib/monitoring`: domain types, classification, simulation, alert/anomaly rules, and storage adapters.
- `src/lib/api`: backend transport and API contracts.

## Migration order

1. Domain types and classification.
2. Alert/anomaly rules.
3. Simulation engine.
4. Local persistence adapter.
5. API boundary.
6. Feature components.
7. React hooks.
8. Automated tests.
9. Replace local repository with API repository when backend is available.

The existing dashboard remains the compatibility surface during migration. No backend credentials belong in client code.
