import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PolicyWeightsDto {
  @ApiProperty({ description: 'Weight for unmet demand penalty' })
  @IsNumber()
  unmet!: number;

  @ApiProperty({ description: 'Weight for overtime penalty' })
  @IsNumber()
  overtime!: number;

  @ApiProperty({ description: 'Weight for fairness penalty' })
  @IsNumber()
  fairness!: number;

  @ApiProperty({ description: 'Weight for preferences penalty' })
  @IsNumber()
  prefs!: number;

  @ApiProperty({ description: 'Weight for substitutes penalty' })
  @IsNumber()
  substitutes!: number;

  @ApiProperty({ description: 'Weight for flex penalty' })
  @IsNumber()
  flex!: number;
}

export class PolicyLimitsDto {
  @ApiProperty({ description: 'Maximum overtime per week in minutes' })
  @IsNumber()
  maxOvertimePerWeekMinutes!: number;

  @ApiProperty({ description: 'Maximum flex shifts per week' })
  @IsNumber()
  maxFlexShiftsPerWeek!: number;
}

export class PolicyTogglesDto {
  @ApiProperty({ description: 'Enable ward flexibility' })
  @IsBoolean()
  enableWardFlex!: boolean;

  @ApiProperty({ description: 'Enable skill substitution' })
  @IsBoolean()
  enableSubstitution!: boolean;
}

export class CreatePolicyDto {
  @ApiProperty({ enum: ['ORG', 'WARD', 'SCHEDULE'], description: 'Policy scope' })
  @IsEnum(['ORG', 'WARD', 'SCHEDULE'])
  scope!: 'ORG' | 'WARD' | 'SCHEDULE';

  @ApiProperty({ required: false, description: 'Ward ID for WARD scope' })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiProperty({ required: false, description: 'Schedule ID for SCHEDULE scope' })
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiProperty({ type: PolicyWeightsDto, description: 'Solver weights' })
  @IsObject()
  @ValidateNested()
  @Type(() => PolicyWeightsDto)
  weights!: PolicyWeightsDto;

  @ApiProperty({ type: PolicyLimitsDto, description: 'Solver limits' })
  @IsObject()
  @ValidateNested()
  @Type(() => PolicyLimitsDto)
  limits!: PolicyLimitsDto;

  @ApiProperty({ type: PolicyTogglesDto, description: 'Solver toggles' })
  @IsObject()
  @ValidateNested()
  @Type(() => PolicyTogglesDto)
  toggles!: PolicyTogglesDto;

  @ApiProperty({ description: 'Skill substitution mapping' })
  @IsObject()
  substitution!: Record<string, string[]>;

  @ApiProperty({ description: 'Solver time budget in milliseconds' })
  @IsNumber()
  timeBudgetMs!: number;

  @ApiProperty({ description: 'Policy label' })
  @IsString()
  label!: string;

  @ApiProperty({ description: 'Whether policy is active' })
  @IsBoolean()
  isActive!: boolean;
}
