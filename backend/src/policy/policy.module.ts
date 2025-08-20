import { Module, forwardRef } from '@nestjs/common';
import { PolicyController } from './policy.controller.js';
import { PolicyService } from './policy.service.js';
import { RuleTemplateController } from './rule-template.controller.js';
import { RuleTemplateService } from './rule-template.service.js';
import { SolveModule } from '../solve/solve.module.js';

@Module({
  imports: [forwardRef(() => SolveModule)],
  controllers: [PolicyController, RuleTemplateController],
  providers: [PolicyService, RuleTemplateService],
  exports: [PolicyService, RuleTemplateService],
})
export class PolicyModule {}
