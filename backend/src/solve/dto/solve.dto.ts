import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SolveDto {
	@ApiProperty({ 
		description: 'Schedule ID to solve',
		example: 'schedule-123'
	})
	@IsString()
	scheduleId!: string;

	@ApiPropertyOptional({ 
		description: 'Time budget in milliseconds',
		minimum: 10000,
		maximum: 600000,
		default: 300000,
		example: 300000
	})
	@IsOptional()
	@IsInt()
	@Min(10000)
	@Max(600000)
	timeBudgetMs?: number = 300000;
}
