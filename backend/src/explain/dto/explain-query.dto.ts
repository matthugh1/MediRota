import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExplainQueryDto {
  @ApiProperty({ description: 'Schedule ID' })
  @IsString()
  @IsNotEmpty()
  scheduleId!: string;

  @ApiProperty({ description: 'Staff ID' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ description: 'Shift slot (e.g., "Early", "Late", "Night")' })
  @IsString()
  @IsNotEmpty()
  slot!: string;
}
