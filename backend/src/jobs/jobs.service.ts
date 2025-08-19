import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class JobsService {
	constructor(private prisma: PrismaService) {}

	async create(createJobDto: CreateJobDto) {
		return this.prisma.job.create({
			data: createJobDto,
			include: {
				staff: {
					include: {
						_count: {
							select: {
								assignments: true,
							},
						},
					},
				},
			},
		});
	}

	async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20 } = paginationDto;
		const skip = (page - 1) * limit;

		const [jobs, total] = await Promise.all([
			this.prisma.job.findMany({
				skip,
				take: limit,
				include: {
					staff: {
						include: {
							_count: {
								select: {
									assignments: true,
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
			this.prisma.job.count(),
		]);

		return {
			data: jobs,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const job = await this.prisma.job.findUnique({
			where: { id },
			include: {
				staff: {
					include: {
						wards: true,
						skills: true,
						_count: {
							select: {
								assignments: true,
							},
						},
					},
				},
			},
		});

		if (!job) {
			throw new NotFoundException(`Job with ID ${id} not found`);
		}

		return job;
	}

	async update(id: string, updateJobDto: UpdateJobDto) {
		await this.findOne(id); // Verify job exists

		return this.prisma.job.update({
			where: { id },
			data: updateJobDto,
			include: {
				staff: {
					include: {
						_count: {
							select: {
								assignments: true,
							},
						},
					},
				},
			},
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify job exists

		return this.prisma.job.delete({
			where: { id },
		});
	}
}
