import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
	@ApiProperty({ description: 'Job code', example: 'nurse' })
	@IsString()
	code!: string;

	@ApiProperty({ description: 'Job name', example: 'Nurse' })
	@IsString()
	name!: string;
}
