import { Module } from '@nestjs/common';
import { WardsService } from './wards.service.js';
import { WardsController } from './wards.controller.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
	controllers: [WardsController],
	providers: [WardsService, OrgCompatService],
	exports: [WardsService],
})
export class WardsModule {}
