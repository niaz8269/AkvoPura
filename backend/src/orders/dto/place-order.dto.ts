import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const PRODUCT_IDS = ['cans', 'gallons', 'pet600', 'pet1500'] as const;
type ProductId = (typeof PRODUCT_IDS)[number];

export class OrderItemDto {
  @IsString() @IsIn(PRODUCT_IDS as readonly string[])
  productId!: ProductId;

  @Type(() => Number) @IsInt() @Min(1)
  qty!: number;

  @Type(() => Number) @IsInt() @Min(0)
  unitPrice!: number;
}

export class PlaceOrderDto {
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional() @IsString()
  preferredTime?: string;

  @IsOptional() @IsString()
  notes?: string;

  /** Owner can place on any branch's behalf — explicit override. */
  @IsOptional() @IsString()
  branchSlug?: string;
}
