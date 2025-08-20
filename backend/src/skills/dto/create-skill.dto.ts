import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
	@ApiProperty({ description: 'Skill code (unique identifier)' })
	@IsString()
	code!: string;

	@ApiProperty({ description: 'Skill name' })
	@IsString()
	name!: string;

	@ApiPropertyOptional({ description: 'Hospital ID to assign the skill to' })
	@IsOptional()
	@IsUUID('4')
	hospitalId?: string;
}
