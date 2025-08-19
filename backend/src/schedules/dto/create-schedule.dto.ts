import { IsString, IsDateString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus } from '@prisma/client';

export class CreateScheduleDto {
	@ApiProperty({ description: 'Ward ID' })
	@IsUUID('4')
	wardId!: string;

	@ApiProperty({ description: 'Schedule horizon start date' })
	@IsDateString()
	horizonStart!: string;

	@ApiProperty({ description: 'Schedule horizon end date' })
	@IsDateString()
	horizonEnd!: string;

	@ApiPropertyOptional({ description: 'Objective description' })
	@IsOptional()
	@IsString()
	objective?: string;

	@ApiPropertyOptional({ description: 'Schedule status', enum: ScheduleStatus })
	@IsOptional()
	@IsEnum(ScheduleStatus)
	status?: ScheduleStatus;
}
