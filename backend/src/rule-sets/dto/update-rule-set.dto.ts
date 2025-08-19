import { PartialType } from '@nestjs/swagger';
import { CreateRuleSetDto } from './create-rule-set.dto.js';

export class UpdateRuleSetDto extends PartialType(CreateRuleSetDto) {}
