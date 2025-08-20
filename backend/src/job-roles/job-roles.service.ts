import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateJobRoleDto } from './dto/create-job-role.dto.js';
import { UpdateJobRoleDto } from './dto/update-job-role.dto.js';
import { JobRoleResponseDto } from './dto/job-role-response.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobRolesService {
	constructor(private prisma: PrismaService) {}

	async create(createJobRoleDto: CreateJobRoleDto): Promise<JobRoleResponseDto> {
		try {
			const jobRole = await this.prisma.jobRole.create({
				data: createJobRoleDto,
			});

			return {
				id: jobRole.id,
				code: jobRole.code,
				name: jobRole.name,
				createdAt: jobRole.createdAt.toISOString(),
			};
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ConflictException('Job role code must be unique');
				}
			}
			throw error;
		}
	}

	async findAll(query?: { search?: string; take?: number; skip?: number; orderBy?: string }) {
		const { search, take = 20, skip = 0, orderBy = 'name' } = query || {};

		let where: Prisma.JobRoleWhereInput = {};
		if (search) {
			where = {
				OR: [
					{ code: { contains: search, mode: 'insensitive' } },
					{ name: { contains: search, mode: 'insensitive' } },
				],
			};
		}

		const [jobRoles, total] = await Promise.all([
			this.prisma.jobRole.findMany({
				where,
				take: Number(take),
				skip: Number(skip),
				orderBy: { [orderBy]: 'asc' },
			}),
			this.prisma.jobRole.count({ where }),
		]);

		const mappedJobRoles: JobRoleResponseDto[] = jobRoles.map(jobRole => ({
			id: jobRole.id,
			code: jobRole.code,
			name: jobRole.name,
			createdAt: jobRole.createdAt.toISOString(),
		}));

		return {
			data: mappedJobRoles,
			total,
			page: Math.floor(skip / take) + 1,
			limit: take,
			totalPages: Math.ceil(total / take),
		};
	}

	async findOne(id: string): Promise<JobRoleResponseDto> {
		const jobRole = await this.prisma.jobRole.findUnique({
			where: { id },
		});

		if (!jobRole) {
			throw new NotFoundException(`Job role with ID ${id} not found`);
		}

		return {
			id: jobRole.id,
			code: jobRole.code,
			name: jobRole.name,
			createdAt: jobRole.createdAt.toISOString(),
		};
	}

	async update(id: string, updateJobRoleDto: UpdateJobRoleDto): Promise<JobRoleResponseDto> {
		try {
			await this.findOne(id); // Verify job role exists

			const jobRole = await this.prisma.jobRole.update({
				where: { id },
				data: updateJobRoleDto,
			});

			return {
				id: jobRole.id,
				code: jobRole.code,
				name: jobRole.name,
				createdAt: jobRole.createdAt.toISOString(),
			};
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new ConflictException('Job role code must be unique');
				}
			}
			throw error;
		}
	}

	async remove(id: string): Promise<void> {
		await this.findOne(id); // Verify job role exists

		// Check if any staff references this job role
		const staffCount = await this.prisma.staff.count({
			where: { jobRoleId: id },
		});

		if (staffCount > 0) {
			throw new ConflictException('Cannot delete job role that is assigned to staff members');
		}

		await this.prisma.jobRole.delete({
			where: { id },
		});
	}
}
