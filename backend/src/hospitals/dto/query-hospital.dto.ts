import { IsOptional, IsUUID } from 'class-validator';

export class QueryHospitalDto {
  @IsOptional()
  @IsUUID('4')
  trustId?: string;
}
