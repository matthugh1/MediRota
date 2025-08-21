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
import { StaffService } from './staff.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { QueryStaffDto } from './dto/query-staff.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('staff')
export class StaffController {
	constructor(private readonly staffService: StaffService) {}

	@Post()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Create a new staff member' })
	@ApiResponse({ status: 201, description: 'Staff created successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	create(@Body() createStaffDto: CreateStaffDto) {
		return this.staffService.create(createStaffDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all staff with pagination' })
	@ApiResponse({ status: 200, description: 'Staff retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findAll(@Query() queryDto: QueryStaffDto) {
		return this.staffService.findAll(queryDto);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER, Role.STAFF)
	@ApiOperation({ summary: 'Get a staff member by ID' })
	@ApiResponse({ status: 200, description: 'Staff retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Staff not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
	findOne(@Param('id') id: string) {
		return this.staffService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Update a staff member' })
	@ApiResponse({ status: 200, description: 'Staff updated successfully' })
	@ApiResponse({ status: 404, description: 'Staff not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
		return this.staffService.update(id, updateStaffDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a staff member' })
	@ApiResponse({ status: 200, description: 'Staff deleted successfully' })
	@ApiResponse({ status: 404, description: 'Staff not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string) {
		return this.staffService.remove(id);
	}

	@Get(':id/shifts')
	@Roles(Role.ADMIN, Role.PLANNER, Role.STAFF)
	@ApiOperation({ summary: 'Get shifts for a staff member' })
	@ApiResponse({ status: 200, description: 'Shifts retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Staff not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
	findMyShifts(@Param('id') id: string) {
		return this.staffService.findMyShifts(id);
	}

	@Get('ward/:wardId/schedule/:scheduleId')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all staff in a ward with their assignments for a specific schedule' })
	@ApiResponse({ status: 200, description: 'Staff and assignments retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Ward or schedule not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findStaffWithAssignments(
		@Param('wardId') wardId: string,
		@Param('scheduleId') scheduleId: string
	) {
		return this.staffService.findStaffWithAssignments(wardId, scheduleId);
	}
}
