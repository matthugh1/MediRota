import { Module } from '@nestjs/common';
import { WardsService } from './wards.service.js';
import { WardsController } from './wards.controller.js';

@Module({
	controllers: [WardsController],
	providers: [WardsService],
	exports: [WardsService],
})
export class WardsModule {}
