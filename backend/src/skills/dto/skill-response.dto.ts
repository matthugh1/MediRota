import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WardSummaryDto {
	@ApiProperty({ description: 'Ward ID' })
	id!: string;

	@ApiProperty({ description: 'Ward name' })
	name!: string;

	@ApiPropertyOptional({ description: 'Hospital ID the ward belongs to' })
	hospitalId?: string | null;
}

export class SkillResponseDto {
	@ApiProperty({ description: 'Skill ID' })
	id!: string;

	@ApiProperty({ description: 'Skill code (unique identifier)' })
	code!: string;

	@ApiProperty({ description: 'Skill name' })
	name!: string;

	@ApiProperty({ description: 'Creation date in ISO format' })
	createdAt!: string;

	@ApiProperty({ description: 'Wards this skill applies to', type: [WardSummaryDto] })
	wards!: WardSummaryDto[];
}
