import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRuleSetDto } from './dto/create-rule-set.dto.js';
import { UpdateRuleSetDto } from './dto/update-rule-set.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class RuleSetsService {
	constructor(
		private readonly prisma: PrismaService,
		private orgCompatService: OrgCompatService,
	) {}

	async create(createRuleSetDto: CreateRuleSetDto) {
		const { rules, ...ruleSetData } = createRuleSetDto;

		return this.prisma.ruleSet.create({
			data: {
				...ruleSetData,
				rules: {
					create: rules,
				},
			},
			include: {
				rules: true,
				ward: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}

	async findAll(paginationDto: PaginationDto, wardId?: string, hospitalId?: string): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20 } = paginationDto;
		const skip = (page - 1) * limit;

		let where = wardId && wardId !== 'all' ? { wardId } : {};
		
		// Apply hospital filter if provided and hierarchy is enabled
		where = this.orgCompatService.applyHospitalFilter(where, hospitalId);

		const [ruleSets, total] = await Promise.all([
			this.prisma.ruleSet.findMany({
				skip,
				take: limit,
				where,
				include: {
					rules: true,
					ward: {
						select: {
							id: true,
							name: true,
						},
					},
					_count: {
						select: {
							rules: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			this.prisma.ruleSet.count({ where }),
		]);

		return {
			data: ruleSets,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const ruleSet = await this.prisma.ruleSet.findUnique({
			where: { id },
			include: {
				rules: true,
				ward: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!ruleSet) {
			throw new NotFoundException(`Rule set with ID ${id} not found`);
		}

		return ruleSet;
	}

	async update(id: string, updateRuleSetDto: UpdateRuleSetDto) {
		await this.findOne(id); // Verify rule set exists

		const { rules, ...ruleSetData } = updateRuleSetDto;

		// If rules are provided, replace all existing rules
		if (rules) {
			// Delete existing rules
			await this.prisma.rule.deleteMany({
				where: { ruleSetId: id },
			});

			// Create new rules
			return this.prisma.ruleSet.update({
				where: { id },
				data: {
					...ruleSetData,
					rules: {
						create: rules,
					},
				},
				include: {
					rules: true,
					ward: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});
		}

		// Update without changing rules
		return this.prisma.ruleSet.update({
			where: { id },
			data: ruleSetData,
			include: {
				rules: true,
				ward: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify rule set exists

		// Delete rules first (due to foreign key constraint)
		await this.prisma.rule.deleteMany({
			where: { ruleSetId: id },
		});

		return this.prisma.ruleSet.delete({
			where: { id },
		});
	}
}
