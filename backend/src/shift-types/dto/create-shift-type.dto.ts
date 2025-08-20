import { IsString, IsBoolean, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftTypeDto {
	@ApiProperty({ description: 'Shift type code (unique identifier)' })
	@IsString()
	code!: string;

	@ApiProperty({ description: 'Shift type name' })
	@IsString()
	name!: string;

	@ApiProperty({ description: 'Start time (HH:MM format)' })
	@IsString()
	startTime!: string;

	@ApiProperty({ description: 'End time (HH:MM format)' })
	@IsString()
	endTime!: string;

	@ApiProperty({ description: 'Whether this is a night shift' })
	@IsBoolean()
	isNight!: boolean;

	@ApiProperty({ description: 'Duration in minutes' })
	@IsInt()
	@Min(1)
	durationMinutes!: number;

	@ApiPropertyOptional({ description: 'Hospital ID to assign the shift type to' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
