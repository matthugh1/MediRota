import { Module } from '@nestjs/common';
import { StaffService } from './staff.service.js';
import { StaffController } from './staff.controller.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
	controllers: [StaffController],
	providers: [StaffService, OrgCompatService],
	exports: [StaffService],
})
export class StaffModule {}
