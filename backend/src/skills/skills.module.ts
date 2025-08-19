import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service.js';
import { SkillsController } from './skills.controller.js';

@Module({
	controllers: [SkillsController],
	providers: [SkillsService],
	exports: [SkillsService],
})
export class SkillsModule {}
