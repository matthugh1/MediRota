import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocksService } from './locks.service.js';
import { CreateLockDto } from './dto/create-lock.dto.js';
import { QueryLocksDto } from './dto/query-locks.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('Locks')
@ApiBearerAuth()
@Controller('locks')
@UseGuards(RolesGuard)
export class LocksController {
  constructor(private readonly locksService: LocksService) {}

  @Post()
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Create a new lock' })
  @ApiResponse({ 
    status: 201, 
    description: 'Lock created successfully',
    schema: {
      example: {
        id: 'lock-123',
        scheduleId: 'schedule-456',
        staffId: 'staff-789',
        date: '2024-01-15',
        slot: 'Early',
        schedule: {
          id: 'schedule-456',
          wardId: 'ward-101',
          horizonStart: '2024-01-01',
          horizonEnd: '2024-01-31',
          status: 'draft'
        },
        staff: {
          id: 'staff-789',
          fullName: 'Dr. Jane Smith',
          role: 'doctor'
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  create(@Body() createLockDto: CreateLockDto) {
    return this.locksService.create(createLockDto);
  }

  @Get()
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Get all locks with optional filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Locks retrieved successfully',
    schema: {
      example: [
        {
          id: 'lock-123',
          scheduleId: 'schedule-456',
          staffId: 'staff-789',
          date: '2024-01-15',
          slot: 'Early',
          schedule: {
            id: 'schedule-456',
            wardId: 'ward-101',
            horizonStart: '2024-01-01',
            horizonEnd: '2024-01-31',
            status: 'draft'
          },
          staff: {
            id: 'staff-789',
            fullName: 'Dr. Jane Smith',
            role: 'doctor'
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  findAll(@Query() query: QueryLocksDto) {
    return this.locksService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Get a specific lock by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lock retrieved successfully',
    schema: {
      example: {
        id: 'lock-123',
        scheduleId: 'schedule-456',
        staffId: 'staff-789',
        date: '2024-01-15',
        slot: 'Early',
        schedule: {
          id: 'schedule-456',
          wardId: 'ward-101',
          horizonStart: '2024-01-01',
          horizonEnd: '2024-01-31',
          status: 'draft'
        },
        staff: {
          id: 'staff-789',
          fullName: 'Dr. Jane Smith',
          role: 'doctor'
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Lock not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  findOne(@Param('id') id: string) {
    return this.locksService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Delete a lock' })
  @ApiResponse({ status: 200, description: 'Lock deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lock not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  remove(@Param('id') id: string) {
    return this.locksService.remove(id);
  }
}
