import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWardDto {
	@ApiProperty({ description: 'Ward name' })
	@IsString()
	name!: string;

	@ApiPropertyOptional({ description: 'Whether ward uses hourly granularity', default: false })
	@IsOptional()
	@IsBoolean()
	hourlyGranularity?: boolean = false;

	@ApiPropertyOptional({ description: 'Hospital ID to assign the ward to' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
