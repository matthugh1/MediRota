import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
	@ApiPropertyOptional({ minimum: 1, default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;
}

export class PaginatedResponseDto<T> {
	@ApiPropertyOptional()
	data!: T[];

	@ApiPropertyOptional()
	total!: number;

	@ApiPropertyOptional()
	page!: number;

	@ApiPropertyOptional()
	limit!: number;

	@ApiPropertyOptional()
	totalPages!: number;
}
