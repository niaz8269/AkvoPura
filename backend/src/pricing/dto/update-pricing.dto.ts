import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePricingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pet600Price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pet1500Price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  canPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gallonPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lostCanFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lostGallonFee?: number;
}
