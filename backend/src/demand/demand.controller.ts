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
import { DemandService } from './demand.service.js';
import { CreateDemandDto } from './dto/create-demand.dto.js';
import { UpdateDemandDto } from './dto/update-demand.dto.js';
import { QueryDemandDto } from './dto/query-demand.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('Demand')
@ApiBearerAuth()
@Controller('demand')
@UseGuards(RolesGuard)
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  @Post()
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Create a new demand entry' })
  @ApiResponse({ 
    status: 201, 
    description: 'Demand created successfully',
    schema: {
      example: {
        id: 'demand-123',
        wardId: 'ward-456',
        date: '2024-01-15',
        slot: 'Early',
        requiredBySkill: { "nurse_resus": 2, "nurse_general": 8 },
        hourlyGranularity: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  create(@Body() createDemandDto: CreateDemandDto) {
    return this.demandService.create(createDemandDto);
  }

  @Get()
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Get all demand entries with optional filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Demand entries retrieved successfully',
    schema: {
      example: [
        {
          id: 'demand-123',
          wardId: 'ward-456',
          date: '2024-01-15',
          slot: 'Early',
          requiredBySkill: { "nurse_resus": 2, "nurse_general": 8 },
          hourlyGranularity: false,
          ward: {
            id: 'ward-456',
            name: 'Emergency Department',
            hourlyGranularity: false
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  findAll(@Query() query: QueryDemandDto) {
    return this.demandService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Get a specific demand entry by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Demand entry retrieved successfully',
    schema: {
      example: {
        id: 'demand-123',
        wardId: 'ward-456',
        date: '2024-01-15',
        slot: 'Early',
        requiredBySkill: { "nurse_resus": 2, "nurse_general": 8 },
        hourlyGranularity: false,
        ward: {
          id: 'ward-456',
          name: 'Emergency Department',
          hourlyGranularity: false
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Demand entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  findOne(@Param('id') id: string) {
    return this.demandService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Update a demand entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Demand entry updated successfully',
    schema: {
      example: {
        id: 'demand-123',
        wardId: 'ward-456',
        date: '2024-01-15',
        slot: 'Early',
        requiredBySkill: { "nurse_resus": 3, "nurse_general": 10 },
        hourlyGranularity: false,
        ward: {
          id: 'ward-456',
          name: 'Emergency Department',
          hourlyGranularity: false
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Demand entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  update(@Param('id') id: string, @Body() updateDemandDto: UpdateDemandDto) {
    return this.demandService.update(id, updateDemandDto);
  }

  @Delete(':id')
  @Roles(Role.PLANNER)
  @ApiOperation({ summary: 'Delete a demand entry' })
  @ApiResponse({ status: 200, description: 'Demand entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Demand entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  remove(@Param('id') id: string) {
    return this.demandService.remove(id);
  }
}
