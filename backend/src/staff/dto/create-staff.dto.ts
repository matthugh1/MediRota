import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffRole } from '@prisma/client';

export class CreateStaffDto {
	@ApiProperty({ description: 'Staff full name' })
	@IsString()
	fullName!: string;

	@ApiProperty({ description: 'Staff role', enum: StaffRole })
	@IsEnum(StaffRole)
	role!: StaffRole;

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

	@ApiProperty({ description: 'Job ID the staff belongs to' })
	@IsUUID('4')
	jobId!: string;

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
