import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class QueryRuleSetsDto extends PaginationDto {
	@ApiPropertyOptional({ description: 'Filter by ward ID' })
	@IsOptional()
	@IsString()
	wardId?: string;
}
