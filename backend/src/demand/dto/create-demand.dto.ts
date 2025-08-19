import { IsString, IsObject, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDemandDto {
  @ApiProperty({ description: 'Ward ID' })
  @IsString()
  wardId!: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsString()
  date!: string;

  @ApiProperty({ description: 'Shift slot (e.g., "Early", "Late", "Night")' })
  @IsString()
  slot!: string;

  @ApiProperty({ 
    description: 'Required staff by skill',
    example: { "nurse_resus": 2, "nurse_general": 8 },
    type: 'object',
    additionalProperties: { type: 'number' }
  })
  @IsObject()
  @Type(() => Object)
  requiredBySkill!: Record<string, number>;

  @ApiPropertyOptional({ description: 'Whether this is hourly granularity', default: false })
  @IsOptional()
  @IsBoolean()
  hourlyGranularity?: boolean = false;
}
