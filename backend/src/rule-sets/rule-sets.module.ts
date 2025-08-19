import { Module } from '@nestjs/common';
import { RuleSetsController } from './rule-sets.controller.js';
import { RuleSetsService } from './rule-sets.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
	imports: [PrismaModule],
	controllers: [RuleSetsController],
	providers: [RuleSetsService],
	exports: [RuleSetsService],
})
export class RuleSetsModule {}
