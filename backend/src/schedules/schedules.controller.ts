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
import { SchedulesService } from './schedules.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('schedules')
export class SchedulesController {
	constructor(private readonly schedulesService: SchedulesService) {}

	@Post()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Create a new schedule' })
	@ApiResponse({ 
		status: 201, 
		description: 'Schedule created successfully',
		schema: {
			example: {
				id: 'schedule-123',
				wardId: 'ward-456',
				horizonStart: '2024-01-01',
				horizonEnd: '2024-01-31',
				status: 'draft',
				objective: 'Optimize staff coverage',
				ward: {
					id: 'ward-456',
					name: 'Emergency Department',
					hourlyGranularity: false
				},
				assignments: [],
				events: [],
				createdAt: '2024-01-15T10:00:00Z',
				updatedAt: '2024-01-15T10:00:00Z'
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Bad request - validation error' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	create(@Body() createScheduleDto: CreateScheduleDto) {
		return this.schedulesService.create(createScheduleDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all schedules with pagination' })
	@ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findAll(@Query() paginationDto: PaginationDto) {
		return this.schedulesService.findAll(paginationDto);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get a schedule by ID' })
	@ApiResponse({ 
		status: 200, 
		description: 'Schedule retrieved successfully',
		schema: {
			example: {
				id: 'schedule-123',
				wardId: 'ward-456',
				horizonStart: '2024-01-01',
				horizonEnd: '2024-01-31',
				status: 'draft',
				objective: 'Optimize staff coverage',
				metrics: {
					hardViolations: 0,
					fairnessStdev: 0.5,
					solveMs: 15000,
					preferenceSatisfaction: 0.85,
					coverageRatio: 0.95
				},
				ward: {
					id: 'ward-456',
					name: 'Emergency Department',
					hourlyGranularity: false
				},
				assignments: [
					{
						id: 'assignment-123',
						scheduleId: 'schedule-123',
						staffId: 'staff-789',
						wardId: 'ward-456',
						date: '2024-01-15',
						slot: 'Early',
						shiftTypeId: 'shift-456',
						staff: {
							id: 'staff-789',
							fullName: 'Dr. Jane Smith',
							role: 'doctor'
						},
						shiftType: {
							id: 'shift-456',
							name: 'Early',
							startTime: '07:00',
							endTime: '15:00',
							isNight: false
						}
					}
				],
				events: [],
				createdAt: '2024-01-15T10:00:00Z',
				updatedAt: '2024-01-15T10:00:00Z'
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Schedule not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findOne(@Param('id') id: string) {
		return this.schedulesService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Update a schedule' })
	@ApiResponse({ status: 200, description: 'Schedule updated successfully' })
	@ApiResponse({ status: 404, description: 'Schedule not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
		return this.schedulesService.update(id, updateScheduleDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a schedule' })
	@ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
	@ApiResponse({ status: 404, description: 'Schedule not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string) {
		return this.schedulesService.remove(id);
	}
}
