import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffRole } from '@prisma/client';

export class StaffResponseDto {
	@ApiProperty({ description: 'Staff ID' })
	id!: string;

	@ApiPropertyOptional({ description: 'Name prefix (e.g., Dr, Mr, Ms, Prof)' })
	prefix?: string | null;

	@ApiProperty({ description: 'Staff first name' })
	firstName!: string;

	@ApiProperty({ description: 'Staff last name' })
	lastName!: string;

	@ApiProperty({ description: 'Staff full name (server-composed)' })
	fullName!: string;

	@ApiProperty({ description: 'Staff role', enum: StaffRole })
	role!: StaffRole;

	@ApiPropertyOptional({ description: 'Grade band' })
	gradeBand?: string | null;

	@ApiProperty({ description: 'Contract hours per week' })
	contractHoursPerWeek!: number;

	@ApiProperty({ description: 'Whether staff is active' })
	active!: boolean;

	@ApiPropertyOptional({ description: 'Job role information' })
	jobRole?: { id: string; code: string; name: string } | null;

	/** @deprecated Legacy job role text - use jobRole instead */
	@ApiPropertyOptional({ description: 'Legacy job role text (deprecated)', deprecated: true })
	legacyJob?: string | null;

	@ApiPropertyOptional({ description: 'Wards the staff can work in' })
	wards?: { id: string; name: string }[];

	@ApiPropertyOptional({ description: 'Skills the staff has' })
	skills?: { id: string; name: string }[];
}
