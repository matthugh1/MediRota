import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service.js';
import { SchedulesController } from './schedules.controller.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
	controllers: [SchedulesController],
	providers: [SchedulesService, OrgCompatService],
	exports: [SchedulesService],
})
export class SchedulesModule {}
