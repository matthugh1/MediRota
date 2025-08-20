import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
	@ApiProperty({ description: 'Skill code (unique identifier)' })
	@IsString()
	code!: string;

	@ApiProperty({ description: 'Skill name' })
	@IsString()
	name!: string;

	@ApiPropertyOptional({ description: 'Ward IDs to assign the skill to' })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	wardIds?: string[];
}
