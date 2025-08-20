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

		// Map key to type for the old Rule model
		const mappedRules = rules.map(rule => ({
			type: rule.key,
			value: rule.value,
		}));

		const ruleSet = await this.prisma.ruleSet.create({
			data: {
				...ruleSetData,
				rules: {
					create: mappedRules,
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

		// Map type back to key for UI compatibility
		return {
			...ruleSet,
			rules: ruleSet.rules.map(rule => ({
				...rule,
				key: rule.type,
			})),
		};
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

		// Map type back to key for UI compatibility
		const mappedRuleSets = ruleSets.map(ruleSet => ({
			...ruleSet,
			rules: ruleSet.rules.map(rule => ({
				...rule,
				key: rule.type,
			})),
		}));

		return {
			data: mappedRuleSets,
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

		// Map type back to key for UI compatibility
		return {
			...ruleSet,
			rules: ruleSet.rules.map(rule => ({
				...rule,
				key: rule.type,
			})),
		};
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

			// Map key to type for the old Rule model
			const mappedRules = rules.map(rule => ({
				type: rule.key,
				value: rule.value,
			}));

			// Create new rules
			const ruleSet = await this.prisma.ruleSet.update({
				where: { id },
				data: {
					...ruleSetData,
					rules: {
						create: mappedRules,
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

			// Map type back to key for UI compatibility
			return {
				...ruleSet,
				rules: ruleSet.rules.map(rule => ({
					...rule,
					key: rule.type,
				})),
			};
		}

		// Update without changing rules
		const ruleSet = await this.prisma.ruleSet.update({
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

		// Map type back to key for UI compatibility
		return {
			...ruleSet,
			rules: ruleSet.rules.map(rule => ({
				...rule,
				key: rule.type,
			})),
		};
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

	async getEffectiveRuleSets(wardId?: string) {
		// For now, return empty array to avoid any database issues
		// This can be enhanced later when we have proper data
		// Also handles invalid UUIDs gracefully
		return [];
	}
}
