import { Module } from '@nestjs/common';
import { ExplainService } from './explain.service.js';
import { ExplainController } from './explain.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExplainController],
  providers: [ExplainService],
  exports: [ExplainService],
})
export class ExplainModule {}
