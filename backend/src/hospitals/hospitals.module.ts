import { Module } from '@nestjs/common';
import { HospitalsService } from './hospitals.service.js';
import { HospitalsController } from './hospitals.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
