import { ApiProperty } from '@nestjs/swagger';

export class RuleTemplateDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	code!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	description!: string;

	@ApiProperty({ required: false })
	paramsSchema?: any;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	updatedAt!: Date;
}

export class CreateRuleTemplateDto {
	@ApiProperty()
	code!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	description!: string;

	@ApiProperty({ required: false })
	paramsSchema?: any;
}

export class UpdateRuleTemplateDto {
	@ApiProperty({ required: false })
	code?: string;

	@ApiProperty({ required: false })
	name?: string;

	@ApiProperty({ required: false })
	description?: string;

	@ApiProperty({ required: false })
	paramsSchema?: any;
}
