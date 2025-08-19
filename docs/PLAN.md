### Execution Plan — MVP (TypeScript-first)

## Milestones
M1 — Repo + Docker + health checks + docs
M2 — Prisma schema & migrations + seed + auth (JWT)
M3 — Core CRUD (wards/skills/shift types/staff) + validators
M4 — Rule sets & Demand editors (desktop)
M5 — Schedules + Locks + Solve orchestration
M6 — Repair orchestration + metrics + Explain (heuristic)
M7 — Planner grid (desktop) + heatmaps
M8 — Employee app (mobile): my shifts + preferences
M9 — Tests (Jest + Playwright), hardening, docs

## Acceptance Criteria
- M1: docker compose up; backend/solver /healthz OK; PRD/PLAN linked in README.
- M2: Prisma migrate works; seed data present; JWT roles (Admin/Planner/Staff).
- M3: CRUD endpoints with Zod/class-validator; OpenAPI examples; slow-log enabled.
- M4: Demand JSONB validated; rule overrides per ward; optimistic concurrency on rules.
- M5: Create schedule; call solver /solve_full; assignments persisted (bulk insert); metrics saved.
- M6: /repair <60s P95 on reference window; locks honoured; explain returns reasons + 3 alternatives.
- M7: Planner grid: lock/unlock, run solve/repair, metrics, breach overlay.
- M8: Employee mobile: my shifts + preferences, tested on iPhone/Pixel sizes.
- M9: CI runs Jest + Playwright; docs updated; 0 hard-rule violations on seed dataset.

## Operating Conventions
- Update /docs/PRD.md and /docs/PLAN.md when scope changes; PR template requires referencing diffs.
- Name long SQL; keep in /backend/sql/*.sql; log query name & duration (no PII).
- Materialised view mv_coverage_by_ward_day for planner heatmaps; admin-only refresh endpoint.

