import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDemandDto {
  @ApiPropertyOptional({ description: 'Ward ID to filter by' })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional({ description: 'Start date in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by hospital ID' })
  @IsOptional()
  @IsUUID('4')
  hospitalId?: string;
}
