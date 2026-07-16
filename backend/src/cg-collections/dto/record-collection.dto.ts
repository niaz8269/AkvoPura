import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordCollectionDto {
  @IsString()
  customerId!: string;

  @Type(() => Number) @IsInt() @Min(0)
  cansCollected!: number;

  @Type(() => Number) @IsInt() @Min(0)
  gallonsCollected!: number;

  /** Cash received at this visit. Defaults to 0. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  cashCollected?: number;

  /** Easypaisa / JazzCash / IBFT etc. Counts toward payment same as cash. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bankCollected?: number;

  @IsOptional() @IsString()
  paymentReference?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  tripNumber?: number;

  @IsString()
  tripId!: string;
}
