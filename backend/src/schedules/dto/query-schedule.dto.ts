import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryScheduleDto {
	@ApiPropertyOptional({ description: 'Filter by hospital ID' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
