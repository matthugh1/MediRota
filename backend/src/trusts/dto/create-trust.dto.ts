import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTrustDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
