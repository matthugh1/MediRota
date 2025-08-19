import { Module, forwardRef } from '@nestjs/common';
import { PolicyController } from './policy.controller.js';
import { PolicyService } from './policy.service.js';
import { SolveModule } from '../solve/solve.module.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
  imports: [forwardRef(() => SolveModule)],
  controllers: [PolicyController],
  providers: [PolicyService, OrgCompatService],
  exports: [PolicyService],
})
export class PolicyModule {}
