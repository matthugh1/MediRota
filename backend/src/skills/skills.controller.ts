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
import { SkillsService } from './skills.service.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { QuerySkillDto } from './dto/query-skill.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Role } from '../auth/roles.enum.js';

@ApiTags('skills')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('skills')
export class SkillsController {
	constructor(private readonly skillsService: SkillsService) {}

	@Post()
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Create a new skill' })
	@ApiResponse({ status: 201, description: 'Skill created successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	create(@Body() createSkillDto: CreateSkillDto) {
		return this.skillsService.create(createSkillDto);
	}

	@Get()
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get all skills with pagination' })
	@ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findAll(@Query() paginationDto: PaginationDto, @Query() queryDto: QuerySkillDto) {
		return this.skillsService.findAll(paginationDto, queryDto);
	}

	@Get(':id')
	@Roles(Role.ADMIN, Role.PLANNER)
	@ApiOperation({ summary: 'Get a skill by ID' })
	@ApiResponse({ status: 200, description: 'Skill retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Skill not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin or Planner role required' })
	findOne(@Param('id') id: string) {
		return this.skillsService.findOne(id);
	}

	@Patch(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Update a skill' })
	@ApiResponse({ status: 200, description: 'Skill updated successfully' })
	@ApiResponse({ status: 404, description: 'Skill not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
		return this.skillsService.update(id, updateSkillDto);
	}

	@Delete(':id')
	@Roles(Role.ADMIN)
	@ApiOperation({ summary: 'Delete a skill' })
	@ApiResponse({ status: 200, description: 'Skill deleted successfully' })
	@ApiResponse({ status: 404, description: 'Skill not found' })
	@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
	remove(@Param('id') id: string) {
		return this.skillsService.remove(id);
	}
}
