import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyAlternativeDto {
  @ApiProperty({ description: 'Schedule ID' })
  @IsString()
  @IsNotEmpty()
  scheduleId!: string;

  @ApiProperty({ description: 'Alternative ID to apply' })
  @IsString()
  @IsNotEmpty()
  alternativeId!: string;
}
