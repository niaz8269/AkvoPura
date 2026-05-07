import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveStockDto {
  @Type(() => Number) @IsInt() @Min(1)
  units!: number;
}
