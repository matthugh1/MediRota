import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobRoleDto {
	@ApiProperty({ description: 'Job role code (unique identifier)', example: 'nurse' })
	@IsString()
	@IsNotEmpty()
	code!: string;

	@ApiProperty({ description: 'Job role display name', example: 'Nurse' })
	@IsString()
	@IsNotEmpty()
	name!: string;

	@ApiPropertyOptional({ description: 'Organizational scope', enum: ['TRUST', 'HOSPITAL'] })
	@IsOptional()
	@IsIn(['TRUST', 'HOSPITAL'])
	scope?: string;

	@ApiPropertyOptional({ description: 'Trust ID (required if scope is TRUST)' })
	@IsOptional()
	@IsUUID('4')
	trustId?: string;

	@ApiPropertyOptional({ description: 'Hospital ID (required if scope is HOSPITAL)' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
