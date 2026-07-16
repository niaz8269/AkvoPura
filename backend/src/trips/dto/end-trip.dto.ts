import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EndTripDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  finalCansOnVan?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  finalGallonsOnVan?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  finalEmptyCansOnVan?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  finalEmptyGallonsOnVan?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  finalPet600Packs?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  finalPet1500Packs?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  declaredCashOnHand?: number;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
