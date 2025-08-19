import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLocksDto {
  @ApiPropertyOptional({ description: 'Schedule ID to filter by' })
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiPropertyOptional({ description: 'Filter by hospital ID' })
  @IsOptional()
  @IsUUID('4')
  hospitalId?: string;
}
