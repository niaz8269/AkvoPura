import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePetCustomerDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString() @MinLength(4)
  phone?: string;

  @IsOptional() @IsString() @MinLength(2)
  address?: string;

  @IsOptional() @IsString() @MinLength(2)
  area?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  pricePet600?: number | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  pricePet1500?: number | null;

  @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsString()
  notes?: string;
}
