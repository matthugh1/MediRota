import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWardDto } from './dto/create-ward.dto.js';
import { UpdateWardDto } from './dto/update-ward.dto.js';
import { QueryWardDto } from './dto/query-ward.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class WardsService {
	constructor(
		private prisma: PrismaService,
		private orgCompatService: OrgCompatService,
	) {}

	async create(createWardDto: CreateWardDto) {
		return this.prisma.ward.create({
			data: createWardDto,
		});
	}

	async findAll(paginationDto: PaginationDto, queryDto: QueryWardDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20 } = paginationDto;
		const { hospitalId } = queryDto;
		const skip = (page - 1) * limit;

		// Apply hospital filter if provided and hierarchy is enabled
		const where = this.orgCompatService.applyHospitalFilter({}, hospitalId);

		const [wards, total] = await Promise.all([
			this.prisma.ward.findMany({
				skip,
				take: limit,
				where,
				include: {
					_count: {
						select: {
							staff: true,
							demands: true,
							schedules: true,
						},
					},
				},
			}),
			this.prisma.ward.count({ where }),
		]);

		return {
			data: wards,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const ward = await this.prisma.ward.findUnique({
			where: { id },
			include: {
				staff: {
					include: {
						skills: true,
					},
				},
				demands: true,
				schedules: true,
				ruleSets: true,
			},
		});

		if (!ward) {
			throw new NotFoundException(`Ward with ID ${id} not found`);
		}

		return ward;
	}

	async update(id: string, updateWardDto: UpdateWardDto) {
		await this.findOne(id); // Verify ward exists

		return this.prisma.ward.update({
			where: { id },
			data: updateWardDto,
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify ward exists

		return this.prisma.ward.delete({
			where: { id },
		});
	}
}
