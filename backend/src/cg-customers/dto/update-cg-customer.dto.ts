import { CGRoute, PaymentCycle } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

/** Mutable fields a manager / salesman can edit. Mutable balances
 *  (debt, empties held, lastActivityAt) are NOT updatable via this
 *  endpoint — they're driven by deliveries / collections / charge-loss. */
export class UpdateCGCustomerDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString() @MinLength(4)
  phone?: string;

  @IsOptional() @IsString() @MinLength(2)
  address?: string;

  @IsOptional() @IsEnum(CGRoute)
  route?: CGRoute;

  @IsOptional() @IsEnum(PaymentCycle)
  paymentCycle?: PaymentCycle;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  usualCans?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  usualGallons?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  pricePerCan?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  pricePerGallon?: number;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsString()
  notes?: string;
}
