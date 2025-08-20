import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrustSummaryDto {
	@ApiProperty({ description: 'Trust ID' })
	id!: string;

	@ApiProperty({ description: 'Trust name' })
	name!: string;
}

export class HospitalSummaryDto {
	@ApiProperty({ description: 'Hospital ID' })
	id!: string;

	@ApiProperty({ description: 'Hospital name' })
	name!: string;
}

export class JobRoleResponseDto {
	@ApiProperty({ description: 'Job role ID' })
	id!: string;

	@ApiProperty({ description: 'Job role code (unique identifier)' })
	code!: string;

	@ApiProperty({ description: 'Job role display name' })
	name!: string;

	@ApiPropertyOptional({ description: 'Organizational scope' })
	scope?: string;

	@ApiPropertyOptional({ description: 'Trust information', type: TrustSummaryDto })
	trust?: TrustSummaryDto | null;

	@ApiPropertyOptional({ description: 'Hospital information', type: HospitalSummaryDto })
	hospital?: HospitalSummaryDto | null;

	@ApiProperty({ description: 'Creation date in ISO format' })
	createdAt!: string;
}
