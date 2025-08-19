import { Module } from '@nestjs/common';
import { LocksService } from './locks.service.js';
import { LocksController } from './locks.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LocksController],
  providers: [LocksService],
  exports: [LocksService],
})
export class LocksModule {}
