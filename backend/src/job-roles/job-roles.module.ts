import { Module } from '@nestjs/common';
import { JobRolesService } from './job-roles.service.js';
import { JobRolesController } from './job-roles.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
	imports: [PrismaModule],
	controllers: [JobRolesController],
	providers: [JobRolesService],
	exports: [JobRolesService],
})
export class JobRolesModule {}
