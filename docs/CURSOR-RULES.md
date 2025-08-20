### Cursor Rules

You are building an MVP multi-ward NHS rota SaaS.

### Stack
- **Backend**: TypeScript, NestJS, Prisma, PostgreSQL. Single truth of types via Prisma.
- **Frontend**: React + TypeScript + Vite + Tailwind. Two areas:
  • Admin/Planner (desktop-first): wards, skills, shift types, rules, demand, schedules, locks, solve/repair, explain.
  • Employee (mobile-first): my shifts, preferences.
- **Solver**: Python 3.11, FastAPI, OR-Tools CP-SAT. Stateless HTTP service called by the backend.

### Scope (MVP)
- Multi-ward; Doctors horizon 6–12 months; Nurses 4–6 weeks.
- No external system integrations; all data created/edited in-app and stored in Postgres.
- Policy system: RuleTemplate (definition) → PolicyRule (instance with scope + params + kind + weight) → Policy (bundle of rules).
- Rules: Hard (skill-mix coverage; ≥11h rest; one shift/day/person; max consecutive nights=3 default; eligibility; weekly rest approx). Soft (fairness for nights/weekends; preferences).
- Objective weights: unfilled=1e6, hard=1e5, fairness=10, preferences=5.
- Repair mode: sub-60s target via warm start + local relaxation windows.
- UK English copy; UK hosting assumed; no PII in logs.

### Architecture & conventions
- Prisma for schema + migrations; raw SQL for heavy/bulk paths (assignments) when needed.
- DTOs validated with Zod or class-validator; OpenAPI auto-generated.
- Named queries; structured logging; slow-log >200ms (no PII).
- Documents are the source of truth and MUST stay updated:
  `/docs/CURSOR-RULES.md`, `/docs/PRD.md`, `/docs/PLAN.md`

### Definition of Done
- OpenAPI complete; unit + integration tests (Jest); Playwright E2E (planner desktop + employee mobile).
- Solver endpoints exercised in tests; repair P95 < 60s on reference dataset.
- Accessibility: 44px touch targets on mobile; keyboard nav on planner grid.

