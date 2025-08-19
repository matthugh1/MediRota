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
import { ShiftTypesService } from './shift-types.service.js';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto.js';
import { UpdateShiftTypeDto } from './dto/update-shift-type.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('shift-types')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('shift-types')
export class ShiftTypesController {
	constructor(private readonly shiftTypesService: ShiftTypesService) {}

	@Post()
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Create a new shift type' })
	@ApiResponse({ status: 201, description: 'Shift type created successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	create(@Body() createShiftTypeDto: CreateShiftTypeDto) {
		return this.shiftTypesService.create(createShiftTypeDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all shift types with pagination' })
	@ApiResponse({ status: 200, description: 'Shift types retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findAll(@Query() paginationDto: PaginationDto) {
		return this.shiftTypesService.findAll(paginationDto);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get a shift type by ID' })
	@ApiResponse({ status: 200, description: 'Shift type retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Shift type not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findOne(@Param('id') id: string) {
		return this.shiftTypesService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Update a shift type' })
	@ApiResponse({ status: 200, description: 'Shift type updated successfully' })
	@ApiResponse({ status: 404, description: 'Shift type not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	update(@Param('id') id: string, @Body() updateShiftTypeDto: UpdateShiftTypeDto) {
		return this.shiftTypesService.update(id, updateShiftTypeDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a shift type' })
	@ApiResponse({ status: 200, description: 'Shift type deleted successfully' })
	@ApiResponse({ status: 404, description: 'Shift type not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string) {
		return this.shiftTypesService.remove(id);
	}
}
