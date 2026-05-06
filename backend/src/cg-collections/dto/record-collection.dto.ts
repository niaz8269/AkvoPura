import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordCollectionDto {
  @IsString()
  customerId!: string;

  @Type(() => Number) @IsInt() @Min(0)
  cansCollected!: number;

  @Type(() => Number) @IsInt() @Min(0)
  gallonsCollected!: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  tripNumber?: number;
}
