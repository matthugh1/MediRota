import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLocksDto {
  @ApiPropertyOptional({ description: 'Schedule ID to filter by' })
  @IsOptional()
  @IsString()
  scheduleId?: string;
}
