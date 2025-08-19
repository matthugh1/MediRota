import { PartialType } from '@nestjs/mapped-types';
import { CreateTrustDto } from './create-trust.dto.js';

export class UpdateTrustDto extends PartialType(CreateTrustDto) {}
