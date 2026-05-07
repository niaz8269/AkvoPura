import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordBillDto {
  @IsString()
  customerId!: string;

  @Type(() => Number) @IsInt() @Min(0)
  pet600Packs!: number;

  @Type(() => Number) @IsInt() @Min(0)
  pet1500Packs!: number;

  /** Bill-time unit prices used for the calculation. The salesman may
   *  override the customer / global default at bill time. */
  @Type(() => Number) @IsInt() @Min(0)
  pricePet600!: number;

  @Type(() => Number) @IsInt() @Min(0)
  pricePet1500!: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  discount?: number;

  @Type(() => Number) @IsInt() @Min(0)
  cashCollected!: number;

  /** Easypaisa / JazzCash / IBFT etc. Counts toward payment same as cash. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bankCollected?: number;

  @IsOptional() @IsString()
  paymentReference?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  tripNumber?: number;
}
