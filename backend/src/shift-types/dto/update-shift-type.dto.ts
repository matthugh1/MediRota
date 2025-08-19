import { PartialType } from '@nestjs/swagger';
import { CreateShiftTypeDto } from './create-shift-type.dto.js';

export class UpdateShiftTypeDto extends PartialType(CreateShiftTypeDto) {}
