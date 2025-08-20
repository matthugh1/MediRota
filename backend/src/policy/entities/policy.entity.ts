import { ApiProperty } from '@nestjs/swagger';
import { PolicyWeightsDto, PolicyLimitsDto, PolicyTogglesDto } from '../dto/create-policy.dto.js';

export class PolicyEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['ORG', 'WARD', 'SCHEDULE'] })
  scope!: 'ORG' | 'WARD' | 'SCHEDULE';

  @ApiProperty({ required: false })
  orgId?: string;

  @ApiProperty({ required: false })
  wardId?: string;

  @ApiProperty({ required: false })
  scheduleId?: string;

  @ApiProperty({ type: PolicyWeightsDto })
  weights!: PolicyWeightsDto;

  @ApiProperty({ type: PolicyLimitsDto })
  limits!: PolicyLimitsDto;

  @ApiProperty({ type: PolicyTogglesDto })
  toggles!: PolicyTogglesDto;

  @ApiProperty()
  substitution!: Record<string, string[]>;

  @ApiProperty()
  timeBudgetMs!: number;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ 
    description: 'Business rules array',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Rule type' },
        kind: { type: 'string', enum: ['HARD', 'SOFT'], description: 'Rule kind' },
        params: { type: 'object', description: 'Rule parameters' },
        weight: { type: 'number', description: 'Weight for soft rules' }
      }
    }
  })
  rules?: Array<{
    type: string;
    kind: 'HARD' | 'SOFT';
    params: Record<string, any>;
    weight?: number;
  }>;
}
