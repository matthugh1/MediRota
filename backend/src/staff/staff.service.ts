import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { PaginatedResponseDto } from '../common/dto/pagination.dto.js';
import { QueryStaffDto } from './dto/query-staff.dto.js';
import { OrgCompatService } from '../common/org-compat.service.js';

function buildFullName(prefix?: string | null, first?: string | null, last?: string | null) {
	return [prefix?.trim(), first?.trim(), last?.trim()].filter(Boolean).join(' ');
}

@Injectable()
export class StaffService {
	constructor(
		private prisma: PrismaService,
		private orgCompatService: OrgCompatService,
	) {}

	async create(createStaffDto: CreateStaffDto) {
		const { wardIds, skillIds, role, ...staffData } = createStaffDto; // Exclude legacy role

		// Compose fullName from individual name fields
		const fullName = buildFullName(staffData.prefix, staffData.firstName, staffData.lastName);

		const createdStaff = await this.prisma.staff.create({
			data: {
				...staffData,
				fullName,
				role: 'nurse', // Default role for backward compatibility
				wards: wardIds ? { connect: wardIds.map(id => ({ id })) } : undefined,
				skills: skillIds ? { connect: skillIds.map(id => ({ id })) } : undefined,
			},
			include: {
				wards: true,
				skills: true,
				jobRole: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
			},
		});

		// Map to response DTO format
		return {
			...createdStaff,
			legacyJob: createdStaff.role, // Map legacy role for backward compatibility
		};
	}

	async findAll(queryDto: QueryStaffDto): Promise<PaginatedResponseDto<any>> {
		const { page = 1, limit = 20, search, wardId, skillId, active, hospitalId } = queryDto;
		const skip = (page - 1) * limit;

		// Build where clause for filtering
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ fullName: { contains: search, mode: 'insensitive' } },
				{ firstName: { contains: search, mode: 'insensitive' } },
				{ lastName: { contains: search, mode: 'insensitive' } },
			];
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
					jobRole: {
						select: {
							id: true,
							code: true,
							name: true,
						},
					},
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

		// Map staff data to include legacyJob
		const mappedStaff = staff.map(s => ({
			...s,
			legacyJob: s.role, // Map legacy role for backward compatibility
		}));

		return {
			data: mappedStaff,
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
				jobRole: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
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

		// Map to response DTO format
		return {
			...staff,
			legacyJob: staff.role, // Map legacy role for backward compatibility
		};
	}

	async update(id: string, updateStaffDto: UpdateStaffDto) {
		const existing = await this.findOne(id); // Verify staff exists

		const { wardIds, skillIds, role, ...staffData } = updateStaffDto; // Exclude legacy role

		// Recompute fullName if any name fields are provided
		let fullName: string | undefined;
		if (staffData.prefix !== undefined || staffData.firstName !== undefined || staffData.lastName !== undefined) {
			const prefix = staffData.prefix ?? existing.prefix;
			const first = staffData.firstName ?? existing.firstName;
			const last = staffData.lastName ?? existing.lastName;
			fullName = buildFullName(prefix, first, last);
		}

		const updatedStaff = await this.prisma.staff.update({
			where: { id },
			data: {
				...staffData,
				...(fullName && { fullName }),
				wards: wardIds ? { set: wardIds.map(id => ({ id })) } : undefined,
				skills: skillIds ? { set: skillIds.map(id => ({ id })) } : undefined,
			},
			include: {
				wards: true,
				skills: true,
				jobRole: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
			},
		});

		// Map to response DTO format
		return {
			...updatedStaff,
			legacyJob: updatedStaff.role, // Map legacy role for backward compatibility
		};
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
