import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TrustsModule } from './trusts/trusts.module.js';
import { HospitalsModule } from './hospitals/hospitals.module.js';
import { WardsModule } from './wards/wards.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { StaffModule } from './staff/staff.module.js';

import { ShiftTypesModule } from './shift-types/shift-types.module.js';
import { RuleSetsModule } from './rule-sets/rule-sets.module.js';
import { SchedulesModule } from './schedules/schedules.module.js';
import { SolveModule } from './solve/solve.module.js';
import { DemandModule } from './demand/demand.module.js';
import { LocksModule } from './locks/locks.module.js';
import { ExplainModule } from './explain/explain.module.js';
import { PolicyModule } from './policy/policy.module.js';
import { JobRolesModule } from './job-roles/job-roles.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		PrismaModule,
		HealthModule,
		TrustsModule,
		HospitalsModule,
		WardsModule,
		SkillsModule,
		StaffModule,

		ShiftTypesModule,
		RuleSetsModule,
		SchedulesModule,
		SolveModule,
		DemandModule,
		LocksModule,
		ExplainModule,
		PolicyModule,
		JobRolesModule,
	],
})
export class AppModule {}

