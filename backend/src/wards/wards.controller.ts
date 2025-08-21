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
import { QueryWardDto } from './dto/query-ward.dto.js';
import { WardResponseDto } from './dto/ward-response.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('wards')
@ApiBearerAuth()
@Controller('wards')
export class WardsController {
	constructor(private readonly wardsService: WardsService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new ward' })
	@ApiResponse({ status: 201, description: 'Ward created successfully' })
	create(@Body() createWardDto: CreateWardDto) {
		return this.wardsService.create(createWardDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all wards with pagination' })
	@ApiResponse({ 
		status: 200, 
		description: 'Wards retrieved successfully',
		type: [WardResponseDto]
	})
	findAll(@Query() queryDto: QueryWardDto) {
		return this.wardsService.findAll(queryDto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a ward by ID' })
	@ApiResponse({ 
		status: 200, 
		description: 'Ward retrieved successfully',
		type: WardResponseDto
	})
	@ApiResponse({ status: 404, description: 'Ward not found' })
	findOne(@Param('id') id: string) {
		return this.wardsService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a ward' })
	@ApiResponse({ status: 200, description: 'Ward updated successfully' })
	@ApiResponse({ status: 404, description: 'Ward not found' })
	update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
		return this.wardsService.update(id, updateWardDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a ward' })
	@ApiResponse({ status: 200, description: 'Ward deleted successfully' })
	@ApiResponse({ status: 404, description: 'Ward not found' })
	remove(@Param('id') id: string) {
		return this.wardsService.remove(id);
	}
}
