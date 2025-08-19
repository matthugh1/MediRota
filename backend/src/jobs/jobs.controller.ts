import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('jobs')
export class JobsController {
	constructor(private readonly jobsService: JobsService) {}

	@Post()
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Create a new job' })
	@ApiResponse({ status: 201, description: 'Job created successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	create(@Body() createJobDto: CreateJobDto) {
		return this.jobsService.create(createJobDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all jobs with pagination' })
	@ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findAll(@Query() paginationDto: PaginationDto) {
		return this.jobsService.findAll(paginationDto);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get a job by ID' })
	@ApiResponse({ status: 200, description: 'Job retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Job not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findOne(@Param('id') id: string) {
		return this.jobsService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Update a job' })
	@ApiResponse({ status: 200, description: 'Job updated successfully' })
	@ApiResponse({ status: 404, description: 'Job not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
		return this.jobsService.update(id, updateJobDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a job' })
	@ApiResponse({ status: 200, description: 'Job deleted successfully' })
	@ApiResponse({ status: 404, description: 'Job not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string) {
		return this.jobsService.remove(id);
	}
}
