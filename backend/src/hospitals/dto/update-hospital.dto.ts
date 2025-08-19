import { PartialType } from '@nestjs/mapped-types';
import { CreateHospitalDto } from './create-hospital.dto.js';

export class UpdateHospitalDto extends PartialType(CreateHospitalDto) {}
