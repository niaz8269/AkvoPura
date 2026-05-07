import { ComplaintStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateComplaintDto {
  /** Manager moves status; customer cannot change status. */
  @IsOptional() @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  /** Customer rates 1–5 only after resolved. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating?: number;
}
