import { PartialType } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto.js';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
