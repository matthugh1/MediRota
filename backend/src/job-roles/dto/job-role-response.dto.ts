import { ApiProperty } from '@nestjs/swagger';

export class JobRoleResponseDto {
	@ApiProperty({ description: 'Job role ID' })
	id!: string;

	@ApiProperty({ description: 'Job role code (unique identifier)' })
	code!: string;

	@ApiProperty({ description: 'Job role display name' })
	name!: string;

	@ApiProperty({ description: 'Creation date in ISO format' })
	createdAt!: string;
}
