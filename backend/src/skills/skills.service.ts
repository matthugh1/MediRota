import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class SkillsService {
	constructor(private prisma: PrismaService) {}

	async create(createSkillDto: CreateSkillDto) {
		return this.prisma.skill.create({
			data: createSkillDto,
		});
	}

	async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20 } = paginationDto;
		const skip = (page - 1) * limit;

		const [skills, total] = await Promise.all([
			this.prisma.skill.findMany({
				skip,
				take: limit,
				include: {
					_count: {
						select: {
							staff: true,
						},
					},
				},
			}),
			this.prisma.skill.count(),
		]);

		return {
			data: skills,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const skill = await this.prisma.skill.findUnique({
			where: { id },
			include: {
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

		return skill;
	}

	async update(id: string, updateSkillDto: UpdateSkillDto) {
		await this.findOne(id); // Verify skill exists

		return this.prisma.skill.update({
			where: { id },
			data: updateSkillDto,
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify skill exists

		return this.prisma.skill.delete({
			where: { id },
		});
	}
}
