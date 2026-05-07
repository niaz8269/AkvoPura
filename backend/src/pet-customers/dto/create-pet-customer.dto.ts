import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePetCustomerDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString() @MinLength(4)
  phone!: string;

  @IsString() @MinLength(2)
  address!: string;

  @IsString() @MinLength(2)
  area!: string;

  @IsString()
  branchSlug!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  pricePet600?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  pricePet1500?: number;

  @IsOptional() @IsString()
  notes?: string;
}
