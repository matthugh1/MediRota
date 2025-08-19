import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto.js';
import { UpdateShiftTypeDto } from './dto/update-shift-type.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class ShiftTypesService {
	constructor(private prisma: PrismaService) {}

	async create(createShiftTypeDto: CreateShiftTypeDto) {
		return this.prisma.shiftType.create({
			data: createShiftTypeDto,
		});
	}

	async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20 } = paginationDto;
		const skip = (page - 1) * limit;

		const [shiftTypes, total] = await Promise.all([
			this.prisma.shiftType.findMany({
				skip,
				take: limit,
				include: {
					_count: {
						select: {
							assignments: true,
						},
					},
				},
			}),
			this.prisma.shiftType.count(),
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
