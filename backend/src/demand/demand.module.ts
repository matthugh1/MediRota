import { Module } from '@nestjs/common';
import { DemandService } from './demand.service.js';
import { DemandController } from './demand.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DemandController],
  providers: [DemandService],
  exports: [DemandService],
})
export class DemandModule {}
