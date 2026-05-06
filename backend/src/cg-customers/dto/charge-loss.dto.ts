import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChargeLossDto {
  @Type(() => Number) @IsInt() @Min(0)
  cans!: number;

  @Type(() => Number) @IsInt() @Min(0)
  gallons!: number;

  /** Total Rs charge (manager-decided, may not equal price × qty if
   *  partial damage / discount). */
  @Type(() => Number) @IsInt() @Min(0)
  totalCharge!: number;
}
