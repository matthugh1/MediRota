import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffRole } from '@prisma/client';

export class CreateStaffDto {
	@ApiPropertyOptional({ description: 'Name prefix (e.g., Dr, Mr, Ms, Prof)' })
	@IsOptional()
	@IsString()
	prefix?: string;

	@ApiProperty({ description: 'Staff first name' })
	@IsString()
	firstName!: string;

	@ApiProperty({ description: 'Staff last name' })
	@IsString()
	lastName!: string;

	/** @deprecated Use jobRoleId instead */
	@ApiPropertyOptional({ description: 'Staff role (deprecated - use jobRoleId instead)', enum: StaffRole, deprecated: true })
	@IsOptional()
	@IsEnum(StaffRole)
	role?: StaffRole;

	@ApiPropertyOptional({ description: 'Grade band' })
	@IsOptional()
	@IsString()
	gradeBand?: string;

	@ApiProperty({ description: 'Contract hours per week' })
	@IsNumber()
	contractHoursPerWeek!: number;

	@ApiPropertyOptional({ description: 'Whether staff is active', default: true })
	@IsOptional()
	@IsBoolean()
	active?: boolean = true;

	@ApiPropertyOptional({ description: 'Ward IDs the staff can work in' })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	wardIds?: string[];

	@ApiProperty({ description: 'Job role ID the staff belongs to' })
	@IsUUID('4')
	jobRoleId!: string;

	@ApiPropertyOptional({ description: 'Skill IDs the staff has' })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	skillIds?: string[];

	@ApiPropertyOptional({ description: 'Hospital ID to assign the staff to' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
