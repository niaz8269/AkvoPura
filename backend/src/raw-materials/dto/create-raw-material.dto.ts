import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRawMaterialDto {
  @IsString() @MinLength(2) @MaxLength(60)
  name!: string;

  /** 'pieces' or 'rolls' — matches the RawMaterialUnit enum in Prisma. */
  @IsIn(['pieces', 'rolls'])
  unit!: 'pieces' | 'rolls';

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  currentStock?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  reorderThreshold?: number;

  @IsOptional() @IsString() @MaxLength(60)
  nameUr?: string;
}
