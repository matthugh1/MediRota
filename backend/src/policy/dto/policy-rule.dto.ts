import { ApiProperty } from '@nestjs/swagger';
import { PolicyRuleKind } from '@prisma/client';

export class PolicyRuleDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	policyId!: string;

	@ApiProperty()
	ruleTemplateId!: string;

	@ApiProperty({ enum: PolicyRuleKind })
	kind!: PolicyRuleKind;

	@ApiProperty()
	params!: any;

	@ApiProperty({ required: false })
	weight?: number;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	updatedAt!: Date;

	// Include rule template details
	@ApiProperty()
	ruleTemplate!: {
		id: string;
		code: string;
		name: string;
		description: string;
	};
}

export class CreatePolicyRuleDto {
	@ApiProperty()
	ruleTemplateId!: string;

	@ApiProperty({ enum: PolicyRuleKind })
	kind!: PolicyRuleKind;

	@ApiProperty()
	params!: any;

	@ApiProperty({ required: false })
	weight?: number;
}

export class UpdatePolicyRuleDto {
	@ApiProperty({ enum: PolicyRuleKind, required: false })
	kind?: PolicyRuleKind;

	@ApiProperty({ required: false })
	params?: any;

	@ApiProperty({ required: false })
	weight?: number;
}
