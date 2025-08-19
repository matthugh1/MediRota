import { Module, forwardRef } from '@nestjs/common';
import { PolicyController } from './policy.controller.js';
import { PolicyService } from './policy.service.js';
import { SolveModule } from '../solve/solve.module.js';

@Module({
  imports: [forwardRef(() => SolveModule)],
  controllers: [PolicyController],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
