import { IsString, IsBoolean, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRuleDto {
	@ApiProperty({ description: 'Rule type' })
	@IsString()
	type!: string;

	@ApiProperty({ description: 'Rule value' })
	@IsString()
	value!: string;
}

export class CreateRuleSetDto {
	@ApiProperty({ description: 'Rule set name' })
	@IsString()
	name!: string;

	@ApiPropertyOptional({ description: 'Rule set description' })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ description: 'Ward ID' })
	@IsUUID('4')
	wardId!: string;

	@ApiPropertyOptional({ description: 'Whether rule set is active', default: true })
	@IsOptional()
	@IsBoolean()
	active?: boolean = true;

	@ApiProperty({ description: 'Rules array', type: [CreateRuleDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateRuleDto)
	rules!: CreateRuleDto[];
}
