import { Module } from '@nestjs/common';
import { TrustsService } from './trusts.service.js';
import { TrustsController } from './trusts.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [TrustsController],
  providers: [TrustsService],
  exports: [TrustsService],
})
export class TrustsModule {}
