import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { QueryStaffDto } from './dto/query-staff.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

@Injectable()
export class StaffService {
	constructor(
		private prisma: PrismaService,
		private orgCompatService: OrgCompatService,
	) {}

	async create(createStaffDto: CreateStaffDto) {
		const { wardIds, skillIds, ...staffData } = createStaffDto;

		return this.prisma.staff.create({
			data: {
				...staffData,
				wards: wardIds ? { connect: wardIds.map(id => ({ id })) } : undefined,
				skills: skillIds ? { connect: skillIds.map(id => ({ id })) } : undefined,
			},
			include: {
				wards: true,
				skills: true,
				job: true,
			},
		});
	}

	async findAll(queryDto: QueryStaffDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20, search, jobId, wardId, skillId, active, hospitalId } = queryDto;
		const skip = (page - 1) * limit;

		// Build where clause for filtering
		const where: any = {};
		
		if (search) {
			where.fullName = { contains: search, mode: 'insensitive' };
		}
		
		if (jobId) {
			where.jobId = jobId;
		}
		
		if (active !== undefined) {
			where.active = active;
		}
		
		if (wardId) {
			where.wards = { some: { id: wardId } };
		}
		
		if (skillId) {
			where.skills = { some: { id: skillId } };
		}

		// Apply hospital filter if provided and hierarchy is enabled
		const finalWhere = this.orgCompatService.applyHospitalFilter(where, hospitalId);

		const [staff, total] = await Promise.all([
			this.prisma.staff.findMany({
				where: finalWhere,
				skip,
				take: limit,
				include: {
					wards: true,
					skills: true,
					job: true,
					_count: {
						select: {
							assignments: true,
							preferences: true,
						},
					},
				},
				orderBy: {
					fullName: 'asc',
				},
			}),
			this.prisma.staff.count({ where: finalWhere }),
		]);

		return {
			data: staff,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const staff = await this.prisma.staff.findUnique({
			where: { id },
			include: {
				wards: true,
				skills: true,
				job: true,
				assignments: {
					include: {
						ward: true,
						shiftType: true,
						schedule: true,
					},
				},
				preferences: true,
			},
		});

		if (!staff) {
			throw new NotFoundException(`Staff with ID ${id} not found`);
		}

		return staff;
	}

	async update(id: string, updateStaffDto: UpdateStaffDto) {
		await this.findOne(id); // Verify staff exists

		const { wardIds, skillIds, ...staffData } = updateStaffDto;

		return this.prisma.staff.update({
			where: { id },
			data: {
				...staffData,
				wards: wardIds ? { set: wardIds.map(id => ({ id })) } : undefined,
				skills: skillIds ? { set: skillIds.map(id => ({ id })) } : undefined,
			},
			include: {
				wards: true,
				skills: true,
				job: true,
			},
		});
	}

	async remove(id: string) {
		await this.findOne(id); // Verify staff exists

		return this.prisma.staff.delete({
			where: { id },
		});
	}

	async findMyShifts(staffId: string) {
		return this.prisma.assignment.findMany({
			where: { staffId },
			include: {
				ward: true,
				shiftType: true,
				schedule: true,
			},
			orderBy: { date: 'asc' },
		});
	}
}
