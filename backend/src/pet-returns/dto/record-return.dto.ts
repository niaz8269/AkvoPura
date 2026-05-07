import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordReturnDto {
  @IsString()
  customerId!: string;

  @Type(() => Number) @IsInt() @Min(0)
  pet600Packs!: number;

  @Type(() => Number) @IsInt() @Min(0)
  pet1500Packs!: number;

  /** Bill-time unit prices used for the refund computation. */
  @Type(() => Number) @IsInt() @Min(0)
  pricePet600!: number;

  @Type(() => Number) @IsInt() @Min(0)
  pricePet1500!: number;

  @IsOptional() @IsString()
  reason?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  tripNumber?: number;
}
