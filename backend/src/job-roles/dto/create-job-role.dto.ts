import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobRoleDto {
	@ApiProperty({ description: 'Job role code (unique identifier)', example: 'nurse' })
	@IsString()
	@IsNotEmpty()
	code!: string;

	@ApiProperty({ description: 'Job role display name', example: 'Nurse' })
	@IsString()
	@IsNotEmpty()
	name!: string;
}
