import { CGRoute, PaymentCycle } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCGCustomerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(4)
  phone!: string;

  @IsString()
  @MinLength(2)
  address!: string;

  @IsString()
  branchSlug!: string;

  @IsEnum(CGRoute)
  route!: CGRoute;

  @IsEnum(PaymentCycle)
  paymentCycle!: PaymentCycle;

  @Type(() => Number) @IsInt() @Min(0)
  pricePerCan!: number;

  @Type(() => Number) @IsInt() @Min(0)
  pricePerGallon!: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  usualCans?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  usualGallons?: number;

  @IsOptional() @IsString()
  notes?: string;
}
