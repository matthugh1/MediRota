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
import { WardsService } from './wards.service.js';
import { CreateWardDto } from './dto/create-ward.dto.js';
import { UpdateWardDto } from './dto/update-ward.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('wards')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('wards')
export class WardsController {
	constructor(private readonly wardsService: WardsService) {}

	@Post()
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Create a new ward' })
	@ApiResponse({ status: 201, description: 'Ward created successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	create(@Body() createWardDto: CreateWardDto) {
		return this.wardsService.create(createWardDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all wards with pagination' })
	@ApiResponse({ status: 200, description: 'Wards retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findAll(@Query() paginationDto: PaginationDto) {
		return this.wardsService.findAll(paginationDto);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get a ward by ID' })
	@ApiResponse({ status: 200, description: 'Ward retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Ward not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findOne(@Param('id') id: string) {
		return this.wardsService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Update a ward' })
	@ApiResponse({ status: 200, description: 'Ward updated successfully' })
	@ApiResponse({ status: 404, description: 'Ward not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
		return this.wardsService.update(id, updateWardDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a ward' })
	@ApiResponse({ status: 200, description: 'Ward deleted successfully' })
	@ApiResponse({ status: 404, description: 'Ward not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string) {
		return this.wardsService.remove(id);
	}
}
