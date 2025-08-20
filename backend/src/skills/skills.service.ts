import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { QuerySkillDto } from './dto/query-skill.dto.js';
import { SkillResponseDto } from './dto/skill-response.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class SkillsService {
	constructor(
		private prisma: PrismaService,
		private orgCompatService: OrgCompatService,
	) {}

	async create(createSkillDto: CreateSkillDto): Promise<SkillResponseDto> {
		const { wardIds, ...skillData } = createSkillDto;

		const skill = await this.prisma.skill.create({
			data: skillData,
		});

		// Create ward relationships if wardIds provided
		if (wardIds?.length) {
			await this.prisma.wardSkill.createMany({
				data: wardIds.map(wardId => ({ wardId, skillId: skill.id })),
				skipDuplicates: true,
			});
		}

		// Return the created skill with wards
		return this.findOne(skill.id);
	}

	async findAll(queryDto: QuerySkillDto): Promise<PaginatedResponseDto<SkillResponseDto>> {
		const { page = 1, limit = 20, hospitalId } = queryDto;
		const skip = (page - 1) * limit;

		// Build where clause for hospital filtering
		let where: any = {};
		if (hospitalId) {
			where = {
				wards: {
					some: {
						ward: {
							hospitalId: hospitalId,
						},
					},
				},
			};
		}

		const [skills, total] = await Promise.all([
			this.prisma.skill.findMany({
				skip,
				take: limit,
				where,
				include: {
					wards: {
						include: {
							ward: {
								select: {
									id: true,
									name: true,
									hospitalId: true,
								},
							},
						},
					},
					_count: {
						select: {
							staff: true,
						},
					},
				},
			}),
			this.prisma.skill.count({ where }),
		]);

		// Map to response DTOs
		const mappedSkills: SkillResponseDto[] = skills.map(skill => ({
			id: skill.id,
			code: skill.code,
			name: skill.name,
			createdAt: skill.createdAt.toISOString(),
			wards: skill.wards.map(ws => ({
				id: ws.ward.id,
				name: ws.ward.name,
				hospitalId: ws.ward.hospitalId,
			})),
		}));

		return {
			data: mappedSkills,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string): Promise<SkillResponseDto> {
		const skill = await this.prisma.skill.findUnique({
			where: { id },
			include: {
				wards: {
					include: {
						ward: {
							select: {
								id: true,
								name: true,
								hospitalId: true,
							},
						},
					},
				},
				staff: {
					include: {
						wards: true,
					},
				},
			},
		});

		if (!skill) {
			throw new NotFoundException(`Skill with ID ${id} not found`);
		}

		// Map to response DTO
		return {
			id: skill.id,
			code: skill.code,
			name: skill.name,
			createdAt: skill.createdAt.toISOString(),
			wards: skill.wards.map(ws => ({
				id: ws.ward.id,
				name: ws.ward.name,
				hospitalId: ws.ward.hospitalId,
			})),
		};
	}

	async update(id: string, updateSkillDto: UpdateSkillDto): Promise<SkillResponseDto> {
		await this.findOne(id); // Verify skill exists

		const { wardIds, ...skillData } = updateSkillDto;

		// Update skill data
		await this.prisma.skill.update({
			where: { id },
			data: skillData,
		});

		// Handle ward relationships if wardIds provided
		if (wardIds !== undefined) {
			// Delete existing relationships
			await this.prisma.wardSkill.deleteMany({
				where: { skillId: id },
			});

			// Create new relationships
			if (wardIds?.length) {
				await this.prisma.wardSkill.createMany({
					data: wardIds.map(wardId => ({ wardId, skillId: id })),
					skipDuplicates: true,
				});
			}
		}

		// Return the updated skill with wards
		return this.findOne(id);
	}

	async remove(id: string) {
		await this.findOne(id); // Verify skill exists

		return this.prisma.skill.delete({
			where: { id },
		});
	}
}
