import { Module } from '@nestjs/common';
import { DemandService } from './demand.service.js';
import { DemandController } from './demand.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [DemandController],
  providers: [DemandService, OrgCompatService],
  exports: [DemandService],
})
export class DemandModule {}
