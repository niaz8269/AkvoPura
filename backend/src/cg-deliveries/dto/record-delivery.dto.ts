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

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  tripNumber?: number;
}
