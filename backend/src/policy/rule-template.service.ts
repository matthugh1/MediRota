import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRuleTemplateDto, UpdateRuleTemplateDto } from './dto/rule-template.dto.js';

@Injectable()
export class RuleTemplateService {
	constructor(private prisma: PrismaService) {}

	async create(createRuleTemplateDto: CreateRuleTemplateDto) {
		return this.prisma.ruleTemplate.create({
			data: createRuleTemplateDto,
		});
	}

	async findAll() {
		return this.prisma.ruleTemplate.findMany({
			orderBy: { name: 'asc' },
		});
	}

	async findOne(id: string) {
		const ruleTemplate = await this.prisma.ruleTemplate.findUnique({
			where: { id },
		});

		if (!ruleTemplate) {
			throw new NotFoundException(`Rule template with ID ${id} not found`);
		}

		return ruleTemplate;
	}

	async findByCode(code: string) {
		const ruleTemplate = await this.prisma.ruleTemplate.findUnique({
			where: { code },
		});

		if (!ruleTemplate) {
			throw new NotFoundException(`Rule template with code ${code} not found`);
		}

		return ruleTemplate;
	}

	async update(id: string, updateRuleTemplateDto: UpdateRuleTemplateDto) {
		await this.findOne(id); // Verify exists

		return this.prisma.ruleTemplate.update({
			where: { id },
			data: updateRuleTemplateDto,
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify exists

		return this.prisma.ruleTemplate.delete({
			where: { id },
		});
	}
}
