import { Module } from '@nestjs/common';
import { ShiftTypesService } from './shift-types.service.js';
import { ShiftTypesController } from './shift-types.controller.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
	controllers: [ShiftTypesController],
	providers: [ShiftTypesService, OrgCompatService],
	exports: [ShiftTypesService],
})
export class ShiftTypesModule {}
