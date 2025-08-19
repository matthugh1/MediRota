import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { ScheduleStatus } from '@prisma/client';

@Injectable()
export class SchedulesService {
	constructor(private prisma: PrismaService) {}

	async create(createScheduleDto: CreateScheduleDto) {
		// Check if there's already a published schedule for this ward
		const existingPublished = await this.prisma.schedule.findFirst({
			where: {
				wardId: createScheduleDto.wardId,
				status: 'published',
			},
		});

		if (existingPublished && createScheduleDto.status === 'published') {
			throw new Error('A published schedule already exists for this ward. Please archive the existing schedule first.');
		}

		return this.prisma.schedule.create({
			data: {
				...createScheduleDto,
				horizonStart: new Date(createScheduleDto.horizonStart),
				horizonEnd: new Date(createScheduleDto.horizonEnd),
			},
			include: {
				ward: true,
				assignments: true,
			},
		});
	}

	async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20 } = paginationDto;
		const skip = (page - 1) * limit;

		const [schedules, total] = await Promise.all([
			this.prisma.schedule.findMany({
				skip,
				take: limit,
				include: {
					ward: true,
					_count: {
						select: {
							assignments: true,
							events: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.schedule.count(),
		]);

		return {
			data: schedules,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const schedule = await this.prisma.schedule.findUnique({
			where: { id },
			include: {
				ward: true,
				assignments: {
					include: {
						staff: {
							include: {
								skills: true,
							},
						},
						shiftType: true,
					},
				},
				events: {
					orderBy: { createdAt: 'desc' },
				},
			},
		});

		if (!schedule) {
			throw new NotFoundException(`Schedule with ID ${id} not found`);
		}

		return schedule;
	}

	async update(id: string, updateScheduleDto: UpdateScheduleDto) {
		await this.findOne(id); // Verify schedule exists

		const data: any = { ...updateScheduleDto };
		if (updateScheduleDto.horizonStart) {
			data.horizonStart = new Date(updateScheduleDto.horizonStart);
		}
		if (updateScheduleDto.horizonEnd) {
			data.horizonEnd = new Date(updateScheduleDto.horizonEnd);
		}

		return this.prisma.schedule.update({
			where: { id },
			data,
			include: {
				ward: true,
			},
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify schedule exists

		return this.prisma.schedule.delete({
			where: { id },
		});
	}

	async updateStatus(id: string, status: ScheduleStatus) {
		await this.findOne(id); // Verify schedule exists

		return this.prisma.schedule.update({
			where: { id },
			data: { status },
		});
	}

	async updateMetrics(id: string, metrics: any) {
		await this.findOne(id); // Verify schedule exists

		return this.prisma.schedule.update({
			where: { id },
			data: { metrics },
		});
	}
}
