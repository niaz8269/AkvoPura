import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const PRODUCT_IDS = ['cans', 'gallons', 'pet600', 'pet1500'] as const;
type ProductId = (typeof PRODUCT_IDS)[number];

export class SubscriptionItemDto {
  @IsString() @IsIn(PRODUCT_IDS as readonly string[])
  productId!: ProductId;

  @Type(() => Number) @IsInt() @Min(1)
  qty!: number;

  @Type(() => Number) @IsInt() @Min(0)
  unitPrice!: number;
}

export class CreateSubscriptionDto {
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionItemDto)
  items!: SubscriptionItemDto[];

  /** 0 = Sunday … 6 = Saturday. At least one. */
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(7)
  @Type(() => Number) @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
  daysOfWeek!: number[];

  @IsOptional() @IsString()
  preferredTime?: string;

  @IsOptional() @IsString()
  notes?: string;

  /** Owner can create on behalf of a customer in any branch. */
  @IsOptional() @IsString()
  branchSlug?: string;
}
