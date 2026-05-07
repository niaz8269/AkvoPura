import { ExpenseCategory } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitExpenseDto {
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @Type(() => Number) @IsInt() @Min(1)
  amount!: number;

  @IsOptional() @IsString()
  notes?: string;

  /** Optional explicit branch override — owner can submit for any branch. */
  @IsOptional() @IsString() @MinLength(2)
  branchSlug?: string;
}
