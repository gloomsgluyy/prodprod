# Production Security Remaining

**Status:** Code-side hardening applied; final stage is external QA/operations verification.

## Code-complete

- Authentication and route session checks.
- Shared role helpers for shipment, finance, commercial, operations, partner, and task mutations.
- Parent existence checks on reviewed mutation routes.
- Protected internal/critical file access.
- Local storage path containment.
- Absolute external document redirect rejection.
- Auto-scrape provider failure does not write fallback market data.
- Deployment refuses tracked local changes and incomplete migrations.
- Compatible security dependency updates applied.
- Parameterized mutation routes reviewed for role and parent/entity existence guards.

## QA/release-only

- Runtime role denial matrix.
- IDOR matrix for every parameterized route.
- Database migration/restore test.
- Durable object-storage configuration and restart persistence.
- Browser viewport QA.
- Full E2E workflow.
- Production smoke test.
- Remaining PostCSS/Next advisory requires planned major upgrade; current compatible release is pinned and builds successfully.

These are not silently marked ready by static code inspection.
