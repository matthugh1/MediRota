import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service.js';
import { SkillsController } from './skills.controller.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
	controllers: [SkillsController],
	providers: [SkillsService, OrgCompatService],
	exports: [SkillsService],
})
export class SkillsModule {}
