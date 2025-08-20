import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HospitalSummaryDto {
	@ApiProperty({ description: 'Hospital ID' })
	id!: string;

	@ApiProperty({ description: 'Hospital name' })
	name!: string;
}

export class WardResponseDto {
	@ApiProperty({ description: 'Ward ID' })
	id!: string;

	@ApiProperty({ description: 'Ward name' })
	name!: string;

	@ApiProperty({ description: 'Whether ward uses hourly granularity' })
	hourlyGranularity!: boolean;

	@ApiProperty({ description: 'Creation date in ISO format' })
	createdAt!: string;

	@ApiPropertyOptional({ description: 'Hospital the ward belongs to', type: HospitalSummaryDto })
	hospital?: HospitalSummaryDto | null;
}
