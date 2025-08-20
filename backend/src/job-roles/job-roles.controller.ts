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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobRolesService } from './job-roles.service.js';
import { CreateJobRoleDto } from './dto/create-job-role.dto.js';
import { UpdateJobRoleDto } from './dto/update-job-role.dto.js';
import { JobRoleResponseDto } from './dto/job-role-response.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('job-roles')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('job-roles')
export class JobRolesController {
	constructor(private readonly jobRolesService: JobRolesService) {}

	@Post()
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Create a new job role' })
	@ApiResponse({ status: 201, description: 'Job role created successfully', type: JobRoleResponseDto })
	@ApiResponse({ status: 409, description: 'Job role code must be unique' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	create(@Body() createJobRoleDto: CreateJobRoleDto): Promise<JobRoleResponseDto> {
		return this.jobRolesService.create(createJobRoleDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all job roles with optional filtering and pagination' })
	@ApiResponse({ status: 200, description: 'Job roles retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	@ApiQuery({ name: 'search', required: false, description: 'Search by code or name' })
	@ApiQuery({ name: 'take', required: false, description: 'Number of items to take', type: Number })
	@ApiQuery({ name: 'skip', required: false, description: 'Number of items to skip', type: Number })
	@ApiQuery({ name: 'orderBy', required: false, description: 'Field to order by', example: 'name' })
	@ApiQuery({ name: 'trustId', required: false, description: 'Filter by trust ID' })
	@ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
	findAll(@Query() query: { search?: string; take?: number; skip?: number; orderBy?: string; trustId?: string; hospitalId?: string }) {
		return this.jobRolesService.findAll(query);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get a job role by ID' })
	@ApiResponse({ status: 200, description: 'Job role retrieved successfully', type: JobRoleResponseDto })
	@ApiResponse({ status: 404, description: 'Job role not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findOne(@Param('id') id: string): Promise<JobRoleResponseDto> {
		return this.jobRolesService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Update a job role' })
	@ApiResponse({ status: 200, description: 'Job role updated successfully', type: JobRoleResponseDto })
	@ApiResponse({ status: 404, description: 'Job role not found' })
	@ApiResponse({ status: 409, description: 'Job role code must be unique' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	update(@Param('id') id: string, @Body() updateJobRoleDto: UpdateJobRoleDto): Promise<JobRoleResponseDto> {
		return this.jobRolesService.update(id, updateJobRoleDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a job role' })
	@ApiResponse({ status: 200, description: 'Job role deleted successfully' })
	@ApiResponse({ status: 404, description: 'Job role not found' })
	@ApiResponse({ status: 409, description: 'Cannot delete job role that is assigned to staff members' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string): Promise<void> {
		return this.jobRolesService.remove(id);
	}
}
