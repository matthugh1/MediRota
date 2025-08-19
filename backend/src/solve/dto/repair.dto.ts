import { IsString, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RepairEventDto {
	@ApiProperty({ 
		description: 'Event type',
		enum: ['staff_unavailable', 'demand_change', 'rule_change', 'sickness'],
		example: 'sickness'
	})
	@IsString()
	type!: 'staff_unavailable' | 'demand_change' | 'rule_change' | 'sickness';

	@ApiProperty({ 
		description: 'Event date in YYYY-MM-DD format',
		example: '2024-01-15'
	})
	@IsString()
	date!: string;

	@ApiPropertyOptional({ 
		description: 'Event slot',
		example: 'Early'
	})
	@IsOptional()
	@IsString()
	slot?: string;

	@ApiPropertyOptional({ 
		description: 'Staff ID affected',
		example: 'staff-123'
	})
	@IsOptional()
	@IsString()
	staffId?: string;

	@ApiPropertyOptional({ 
		description: 'Ward ID affected',
		example: 'ward-456'
	})
	@IsOptional()
	@IsString()
	wardId?: string;

	@ApiProperty({ 
		description: 'Event payload',
		example: { reason: 'Staff member called in sick' }
	})
	payload!: any;
}

export class RepairDto {
	@ApiProperty({ 
		description: 'Schedule ID to repair',
		example: 'schedule-123'
	})
	@IsString()
	scheduleId!: string;

	@ApiProperty({ 
		description: 'Events that triggered the repair',
		type: [RepairEventDto],
		example: [
			{
				type: 'sickness',
				date: '2024-01-15',
				slot: 'Early',
				staffId: 'staff-123',
				wardId: 'ward-456',
				payload: { reason: 'Staff member called in sick' }
			}
		]
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RepairEventDto)
	events!: RepairEventDto[];

	@ApiPropertyOptional({ 
		description: 'Time budget in milliseconds',
		minimum: 10000,
		maximum: 120000,
		default: 60000,
		example: 60000
	})
	@IsOptional()
	@IsInt()
	@Min(10000)
	@Max(120000)
	timeBudgetMs?: number = 60000;
}
