import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordDeliveryDto {
  @IsString()
  customerId!: string;

  @Type(() => Number) @IsInt() @Min(0)
  cansDelivered!: number;

  @Type(() => Number) @IsInt() @Min(0)
  gallonsDelivered!: number;

  @Type(() => Number) @IsInt() @Min(0)
  emptyCansCollected!: number;

  @Type(() => Number) @IsInt() @Min(0)
  emptyGallonsCollected!: number;

  @Type(() => Number) @IsInt() @Min(0)
  cashCollected!: number;

  /** Easypaisa / JazzCash / IBFT etc. Counts toward payment same as cash. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bankCollected?: number;

  @IsOptional() @IsString()
  paymentReference?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  tripNumber?: number;

  /** Required — id of the salesman's currently-open trip. */
  @IsString()
  tripId!: string;
}
