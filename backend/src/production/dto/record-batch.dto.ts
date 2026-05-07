import { ProducedProduct } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecordBatchDto {
  @IsEnum(ProducedProduct)
  product!: ProducedProduct;

  @Type(() => Number) @IsInt() @Min(1)
  unitsProduced!: number;

  @IsString() @MinLength(2)
  batchNumber!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  tdsPpm?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  phLevel?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  wastage?: number;

  @IsOptional() @IsString()
  notes?: string;

  /** Optional explicit branch override — owner can record for any. */
  @IsOptional() @IsString()
  branchSlug?: string;
}
