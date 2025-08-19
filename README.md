### MediRota — MVP multi-ward NHS rota SaaS

- See project docs:
  - `/docs/CURSOR-RULES.md`
  - `/docs/PRD.md`
  - `/docs/PLAN.md`

### Quick start (Docker)

1. **Optional**: Run `./setup-env.sh` to create local `.env` files
2. `docker compose -f deploy/docker-compose.yml up --build`
3. Backend: http://localhost:8080/healthz, Swagger: http://localhost:8080/docs
4. Solver: http://localhost:8090/healthz
5. UI: http://localhost:5173

### Environment Variables

For local development, create `.env` files in each service directory:

**Backend** (`backend/.env`):
```
DATABASE_URL="postgresql://medirota:medirota@localhost:5432/medirota"
PORT=8080
NODE_ENV=development
```

**Solver** (`solver/.env`):
```
SOLVER_HOST=0.0.0.0
SOLVER_PORT=8090
```

**UI** (`ui/.env`):
```
VITE_API_URL=http://localhost:8080
VITE_SOLVER_URL=http://localhost:8090
```

### Workspaces

- Backend (NestJS, Prisma, PostgreSQL): `/backend`
- Solver (FastAPI, OR-Tools): `/solver`
- UI (Vite React TS + Tailwind): `/ui`

### TestWard Seed Script

To create a complete test environment with sample data and run the first solve:

1. **Install dependencies** (if not already installed):
   ```bash
   cd backend
   npm install --save-dev luxon
   ```

2. **Set environment variables**:
   ```bash
   export API_BASE="http://localhost:3000"
   # Optional if auth is enabled:
   export AUTH_TOKEN="eyJhbGciOi..."
   ```

3. **Run the seed script**:
   ```bash
   cd backend
   npm run seed:testward
   ```

This will create:
- **Ward**: TestWard (hourlyGranularity=false)
- **Jobs**: Nurse, Doctor, Radiographer
- **Skills**: MRI_scanning, Ventilator, Resus, Phlebotomy
- **Shift Types**: Early, Late, Night
- **Staff**: 8 mixed staff across jobs with different skills
- **Demand**: 4 weeks of Night shifts (28 entries)
- **Schedule**: 4-week horizon
- **Solve**: Run optimization and log metrics

**Example Output:**
```
🎉 Seed completed successfully!
📋 Summary:
   - Ward ID: 9da2aaf9-a7ee-432f-b9e8-9915870cfc9f
   - Schedule ID: 185aa7f1-492d-4b14-b9bb-119ee8065d84
   - Staff Created: 8
   - Skills Created: 4
   - Jobs Created: 3
   - Shift Types Created: 3
   - Demand Entries: 28
   - Solve Metrics: 0 violations, 62ms
```

The script is idempotent and will reuse existing entities if they already exist.

### Cleanup Script

If you need to clean up the database (e.g., after multiple seed runs that created duplicates):

```bash
# Clean up all test data using Prisma (recommended)
npm run cleanup:testward:prisma

# Or clean up using API endpoints (may fail due to foreign key constraints)
npm run cleanup:testward
```

The cleanup script will remove all data in the correct order to avoid foreign key constraint violations. After cleanup, you can run the seed script again to create fresh test data.

