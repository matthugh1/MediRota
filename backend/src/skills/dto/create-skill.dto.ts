import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillDto {
	@ApiProperty({ description: 'Skill code (unique identifier)' })
	@IsString()
	code!: string;

	@ApiProperty({ description: 'Skill name' })
	@IsString()
	name!: string;
}
