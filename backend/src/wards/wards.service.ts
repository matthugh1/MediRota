import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWardDto } from './dto/create-ward.dto.js';
import { UpdateWardDto } from './dto/update-ward.dto.js';
import { QueryWardDto } from './dto/query-ward.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { WardResponseDto } from './dto/ward-response.dto.js';

@Injectable()
export class WardsService {
	constructor(private prisma: PrismaService) {}

	async create(createWardDto: CreateWardDto) {
		return this.prisma.ward.create({
			data: createWardDto,
		});
	}

	async findAll(queryDto: QueryWardDto): Promise<PaginatedResponseDto<WardResponseDto>> {
		const { page = 1, limit = 20 } = queryDto;
		const skip = (page - 1) * limit;

		// Build where clause for filtering
		const where: any = {};
		if (queryDto.hospitalId) {
			where.hospitalId = queryDto.hospitalId;
		}

		const [wards, total] = await Promise.all([
			this.prisma.ward.findMany({
				where,
				skip,
				take: limit,
				include: {
					hospital: {
						select: {
							id: true,
							name: true,
						},
					},
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

		// Map to response DTOs
		const mappedWards: WardResponseDto[] = wards.map(ward => ({
			id: ward.id,
			name: ward.name,
			hourlyGranularity: ward.hourlyGranularity,
			createdAt: ward.createdAt.toISOString(),
			hospital: ward.hospital ? {
				id: ward.hospital.id,
				name: ward.hospital.name,
			} : null,
		}));

		return {
			data: mappedWards,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string): Promise<WardResponseDto> {
		const ward = await this.prisma.ward.findUnique({
			where: { id },
			include: {
				hospital: {
					select: {
						id: true,
						name: true,
					},
				},
				staff: {
					include: {
						skills: true,
					},
				},
				demands: true,
				schedules: true,
		
			},
		});

		if (!ward) {
			throw new NotFoundException(`Ward with ID ${id} not found`);
		}

		// Map to response DTO
		return {
			id: ward.id,
			name: ward.name,
			hourlyGranularity: ward.hourlyGranularity,
			createdAt: ward.createdAt.toISOString(),
			hospital: ward.hospital ? {
				id: ward.hospital.id,
				name: ward.hospital.name,
			} : null,
		};
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
