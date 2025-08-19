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
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiQuery,
} from '@nestjs/swagger';
import { RuleSetsService } from './rule-sets.service.js';
import { CreateRuleSetDto } from './dto/create-rule-set.dto.js';
import { UpdateRuleSetDto } from './dto/update-rule-set.dto.js';
import { QueryRuleSetsDto } from './dto/query-rule-sets.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@ApiTags('rule-sets')
@ApiBearerAuth()
@Controller('rule-sets')
@UseGuards(RolesGuard)
export class RuleSetsController {
	constructor(private readonly ruleSetsService: RuleSetsService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new rule set' })
	@ApiResponse({ status: 201, description: 'Rule set created successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	create(@Body() createRuleSetDto: CreateRuleSetDto) {
		return this.ruleSetsService.create(createRuleSetDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all rule sets with pagination' })
	@ApiResponse({ status: 200, description: 'Rule sets retrieved successfully' })
	@ApiQuery({ name: 'wardId', required: false, description: 'Filter by ward ID' })
	@ApiQuery({ name: 'page', required: false, description: 'Page number' })
	@ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
	findAll(@Query() queryDto: QueryRuleSetsDto) {
		const { wardId, hospitalId, ...paginationDto } = queryDto;
		return this.ruleSetsService.findAll(paginationDto, wardId, hospitalId);
	}

	@Get('effective')
	@ApiOperation({ summary: 'Get effective rule sets for given scope' })
	@ApiQuery({ name: 'wardId', required: false, description: 'Ward ID for WARD scope' })
	@ApiResponse({ status: 200, description: 'Effective rule sets' })
	getEffective(@Query('wardId') wardId?: string) {
		return this.ruleSetsService.getEffectiveRuleSets(wardId);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a rule set by ID' })
	@ApiResponse({ status: 200, description: 'Rule set retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Rule set not found' })
	findOne(@Param('id') id: string) {
		return this.ruleSetsService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a rule set' })
	@ApiResponse({ status: 200, description: 'Rule set updated successfully' })
	@ApiResponse({ status: 404, description: 'Rule set not found' })
	update(@Param('id') id: string, @Body() updateRuleSetDto: UpdateRuleSetDto) {
		return this.ruleSetsService.update(id, updateRuleSetDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a rule set' })
	@ApiResponse({ status: 200, description: 'Rule set deleted successfully' })
	@ApiResponse({ status: 404, description: 'Rule set not found' })
	remove(@Param('id') id: string) {
		return this.ruleSetsService.remove(id);
	}
}
