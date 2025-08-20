import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RuleTemplateService } from './rule-template.service.js';
import { CreateRuleTemplateDto, UpdateRuleTemplateDto, RuleTemplateDto } from './dto/rule-template.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@ApiTags('Rule Templates')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/rule-templates')
export class RuleTemplateController {
	constructor(private readonly ruleTemplateService: RuleTemplateService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new rule template' })
	@ApiResponse({ status: 201, description: 'Rule template created', type: RuleTemplateDto })
	create(@Body() createRuleTemplateDto: CreateRuleTemplateDto) {
		return this.ruleTemplateService.create(createRuleTemplateDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all rule templates' })
	@ApiResponse({ status: 200, description: 'List of rule templates', type: [RuleTemplateDto] })
	findAll() {
		return this.ruleTemplateService.findAll();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get rule template by ID' })
	@ApiResponse({ status: 200, description: 'Rule template found', type: RuleTemplateDto })
	findOne(@Param('id') id: string) {
		return this.ruleTemplateService.findOne(id);
	}

	@Get('code/:code')
	@ApiOperation({ summary: 'Get rule template by code' })
	@ApiResponse({ status: 200, description: 'Rule template found', type: RuleTemplateDto })
	findByCode(@Param('code') code: string) {
		return this.ruleTemplateService.findByCode(code);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update rule template' })
	@ApiResponse({ status: 200, description: 'Rule template updated', type: RuleTemplateDto })
	update(@Param('id') id: string, @Body() updateRuleTemplateDto: UpdateRuleTemplateDto) {
		return this.ruleTemplateService.update(id, updateRuleTemplateDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete rule template' })
	@ApiResponse({ status: 200, description: 'Rule template deleted', type: RuleTemplateDto })
	remove(@Param('id') id: string) {
		return this.ruleTemplateService.remove(id);
	}
}
