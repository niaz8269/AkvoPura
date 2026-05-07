import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRawMaterialDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString()
  nameUr?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  reorderThreshold?: number;
}
