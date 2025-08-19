import { PartialType } from '@nestjs/swagger';
import { CreateDemandDto } from './create-demand.dto.js';

export class UpdateDemandDto extends PartialType(CreateDemandDto) {}
