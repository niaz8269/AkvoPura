import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentType, Role } from '@prisma/client';

const ALLOWED_ROLES: Role[] = [
  Role.manager,
  Role.pets_salesman,
  Role.cans_gallons_salesman,
  Role.production_worker,
  Role.driver,
  Role.helper,
  Role.other,
];

const ALLOWED_TYPES: EmploymentType[] = [
  EmploymentType.salaried,
  EmploymentType.hourly,
];

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsIn(ALLOWED_ROLES as unknown as string[])
  role!: Role;

  /** Owner can create on any branch's behalf — manager only on own. */
  @IsOptional() @IsString()
  branchSlug?: string;

  @IsIn(ALLOWED_TYPES as unknown as string[])
  employmentType!: EmploymentType;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  monthlySalary?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  hourlyRate?: number;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  linkedUserId?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsIn(ALLOWED_ROLES as unknown as string[])
  role?: Role;

  @IsOptional() @IsIn(ALLOWED_TYPES as unknown as string[])
  employmentType?: EmploymentType;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  monthlySalary?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  hourlyRate?: number;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  linkedUserId?: string;
}

export class CheckInDto {
  @IsOptional() @IsString()
  note?: string;
}

export class RecordDisbursementDto {
  @IsString()
  /** yyyy-mm format. */
  period!: string;

  @Type(() => Number) @IsInt() @Min(1)
  amount!: number;

  @IsOptional() @IsString()
  notes?: string;
}
