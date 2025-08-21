import { IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryShiftTypeDto {
	@ApiPropertyOptional({ description: 'Filter by trust ID' })
	@IsOptional()
	@IsUUID('4')
	trustId?: string;

	@ApiPropertyOptional({ description: 'Filter by hospital ID' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;

	@ApiPropertyOptional({ description: 'Filter by ward ID' })
	@IsOptional()
	@IsUUID('4')
	wardId?: string;

	@ApiPropertyOptional({ description: 'Page number', default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page?: number;

	@ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit?: number;
}
