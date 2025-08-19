import { PartialType } from '@nestjs/swagger';
import { CreatePolicyDto } from './create-policy.dto.js';

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}
