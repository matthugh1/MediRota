import { PartialType } from '@nestjs/swagger';
import { CreateJobRoleDto } from './create-job-role.dto.js';

export class UpdateJobRoleDto extends PartialType(CreateJobRoleDto) {}
