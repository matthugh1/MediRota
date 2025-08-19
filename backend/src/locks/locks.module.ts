import { Module } from '@nestjs/common';
import { LocksService } from './locks.service.js';
import { LocksController } from './locks.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [LocksController],
  providers: [LocksService, OrgCompatService],
  exports: [LocksService],
})
export class LocksModule {}
