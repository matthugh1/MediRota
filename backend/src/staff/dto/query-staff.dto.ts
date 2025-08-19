import { IsOptional, IsInt, Min, Max, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryStaffDto {
	@ApiPropertyOptional({ minimum: 1, default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(1000)
	limit?: number = 20;

	@ApiPropertyOptional({ description: 'Search by name' })
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({ description: 'Filter by job ID' })
	@IsOptional()
	@IsString()
	jobId?: string;

	@ApiPropertyOptional({ description: 'Filter by ward ID' })
	@IsOptional()
	@IsString()
	wardId?: string;

	@ApiPropertyOptional({ description: 'Filter by skill ID' })
	@IsOptional()
	@IsString()
	skillId?: string;

	@ApiPropertyOptional({ description: 'Filter by active status' })
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	active?: boolean;

	@ApiPropertyOptional({ description: 'Filter by hospital ID' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
