import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FulfillOrderDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  cashCollected?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bankCollected?: number;

  @IsOptional() @IsString()
  paymentReference?: string;

  /** CG only — empties picked up from the customer at delivery. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  emptyCansCollected?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  emptyGallonsCollected?: number;

  /** Pets only — flat Rs discount applied to the Pets sub-bill. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  discount?: number;
}
