import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto.js';
import { UpdateShiftTypeDto } from './dto/update-shift-type.dto.js';
import { QueryShiftTypeDto } from './dto/query-shift-type.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class ShiftTypesService {
	constructor(
		private prisma: PrismaService,
		private orgCompatService: OrgCompatService,
	) {}

	async create(createShiftTypeDto: CreateShiftTypeDto) {
		return this.prisma.shiftType.create({
			data: createShiftTypeDto,
		});
	}

	async findAll(queryDto: QueryShiftTypeDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20, trustId, hospitalId, wardId } = queryDto;
		const skip = (page - 1) * limit;

		// Build where clause for scope inheritance
		let where: any = {};
		
		if (wardId) {
			// If wardId is provided, get shift types scoped to:
			// - This specific ward
			// - The hospital containing this ward
			// - The trust containing this hospital
			where = {
				OR: [
					{ wardId: wardId },
					{ hospitalId: hospitalId },
					{ trustId: trustId }
				]
			};
		} else if (hospitalId) {
			// If hospitalId is provided, get shift types scoped to:
			// - This specific hospital
			// - The trust containing this hospital
			where = {
				OR: [
					{ hospitalId: hospitalId },
					{ trustId: trustId }
				]
			};
		} else if (trustId) {
			// If trustId is provided, get shift types scoped to this trust
			where = { trustId: trustId };
		}
		
		// If no scope parameters provided, return all shift types
		if (!where.OR && !where.trustId) {
			where = {};
		}

		const [shiftTypes, total] = await Promise.all([
			this.prisma.shiftType.findMany({
				skip,
				take: limit,
				where,
				include: {
					_count: {
						select: {
							assignments: true,
						},
					},
				},
			}),
			this.prisma.shiftType.count({ where }),
		]);

		return {
			data: shiftTypes,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const shiftType = await this.prisma.shiftType.findUnique({
			where: { id },
			include: {
				assignments: {
					include: {
						staff: true,
						ward: true,
						schedule: true,
					},
				},
			},
		});

		if (!shiftType) {
			throw new NotFoundException(`Shift type with ID ${id} not found`);
		}

		return shiftType;
	}

	async update(id: string, updateShiftTypeDto: UpdateShiftTypeDto) {
		await this.findOne(id); // Verify shift type exists

		return this.prisma.shiftType.update({
			where: { id },
			data: updateShiftTypeDto,
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify shift type exists

		return this.prisma.shiftType.delete({
			where: { id },
		});
	}
}
