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
import { SkillResponseDto } from './dto/skill-response.dto.js';
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
	@ApiOperation({ summary: 'Create a new skill' })
	@ApiResponse({ status: 201, description: 'Skill created successfully', type: SkillResponseDto })
	create(@Body() createSkillDto: CreateSkillDto): Promise<SkillResponseDto> {
		return this.skillsService.create(createSkillDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all skills with pagination' })
	@ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
	findAll(@Query() queryDto: QuerySkillDto) {
		return this.skillsService.findAll(queryDto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a skill by ID' })
	@ApiResponse({ status: 200, description: 'Skill retrieved successfully', type: SkillResponseDto })
	@ApiResponse({ status: 404, description: 'Skill not found' })
	findOne(@Param('id') id: string): Promise<SkillResponseDto> {
		return this.skillsService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a skill' })
	@ApiResponse({ status: 200, description: 'Skill updated successfully', type: SkillResponseDto })
	@ApiResponse({ status: 404, description: 'Skill not found' })
	update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto): Promise<SkillResponseDto> {
		return this.skillsService.update(id, updateSkillDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a skill' })
	@ApiResponse({ status: 200, description: 'Skill deleted successfully' })
	@ApiResponse({ status: 404, description: 'Skill not found' })
	remove(@Param('id') id: string) {
		return this.skillsService.remove(id);
	}
}
