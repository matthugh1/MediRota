import { Module } from '@nestjs/common';
import { ShiftTypesService } from './shift-types.service.js';
import { ShiftTypesController } from './shift-types.controller.js';

@Module({
	controllers: [ShiftTypesController],
	providers: [ShiftTypesService],
	exports: [ShiftTypesService],
})
export class ShiftTypesModule {}
