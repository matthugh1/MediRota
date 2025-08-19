### Product Requirements Document — MVP (TS/NestJS/Prisma; no integrations)

## Problem
Hospitals need compliant, fair rotas for doctors (6–12 months) and nurses (4–6 weeks), with fast repair for sickness. Existing tools struggle with rule complexity, fairness, and sub-minute repairs.

## Goals
1) Generate compliant rotas that meet skill-mix coverage and hard rules.
2) Balance fairness for undesirable shifts within each planning horizon.
3) Provide sub-60s repair for urgent changes.
4) Deliver desktop-first admin/planner UX and mobile-first employee UX.
5) Persist all data in Postgres (Prisma); no CSV imports.

## Users & Roles
- Admin: global config, user/role management.
- Planner (ward): manage ward data; run solve/repair; publish schedules.
- Staff (employee): view personal shifts; set basic preferences.
- Agency (view): scaffolded access to vacancies (future).

## In-Scope (MVP)
- Entities: Ward, Skill, Staff (+skills, wards), ShiftType, RuleSet (+Rules), Demand(required_by_skill JSONB), Schedule, Assignment, Lock, Preference, Event.
- Rules engine: hard + soft; objective weights A=1e6, B=1e5, C=10, D=5.
- Solve (full horizon) & Repair (narrow windows) with locks + warm-start hints.
- Planner desktop UI (grid, heatmaps, lock/re-solve, explain).
- Employee mobile UI (my shifts, preferences).
- Explain (heuristic): reasons + top alternatives.

## Out-of-Scope (MVP)
- Cost/agency optimisation; automated HR integrations; self-service swaps; rolling fairness beyond horizon; AI demand forecasting.

## Key Constraints (defaults)
Hard: coverage by skill-mix; ≥11h rest; one shift/day; max 3 consecutive nights; eligibility; weekly rest approx.
Soft: fairness (night/weekend balance), preferences (prefer_off).

## Success Criteria
- 0 hard rule breaches; 100% coverage of configured demand.
- Repair P95 < 60s on reference dataset.
- Mobile employee flow passes Playwright on iPhone/Pixel; planner grid supports lock/re-solve with metrics.

## APIs (top-level)
Backend (Nest):
- CRUD: wards, skills, shift-types, staff, rule-sets & rules, demand, schedules, locks, preferences.
- POST /solve { scheduleId, timeBudgetMs? }
- POST /repair { scheduleId, events:[…], timeBudgetMs? }
- GET /explain?scheduleId&staffId&date&slot

Solver (Python):
- POST /solve_full
- POST /solve_repair

## Risks & Assumptions
- Trust-specific rules vary → config overrides per ward.
- Manual entry risk → form validators + DB constraints.
- Repair speed depends on tight windows + hints.

