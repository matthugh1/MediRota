import { Module, forwardRef } from '@nestjs/common';
import { SolveService } from './solve.service.js';
import { SolveController } from './solve.controller.js';
import { SolverClientService } from './solver-client.service.js';
import { SchedulesModule } from '../schedules/schedules.module.js';
import { PolicyModule } from '../policy/policy.module.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
	imports: [SchedulesModule, forwardRef(() => PolicyModule)],
	controllers: [SolveController],
	providers: [SolveService, SolverClientService, OrgCompatService],
	exports: [SolveService, SolverClientService],
})
export class SolveModule {}
