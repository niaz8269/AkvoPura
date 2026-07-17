import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PrepareTripDto {
  /** Which salesman this trip is for. */
  @IsString()
  salesmanId!: string;

  @IsIn(['cg', 'pets'])
  role!: 'cg' | 'pets';

  @IsString() @MinLength(2) @MaxLength(40)
  vehicleLabel!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  initialCansLoaded?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  initialGallonsLoaded?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  initialPet600Packs?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  initialPet1500Packs?: number;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
