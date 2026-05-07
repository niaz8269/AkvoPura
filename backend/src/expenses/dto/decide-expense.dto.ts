import { ExpenseStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

const DECISION_VALUES = [
  ExpenseStatus.approved,
  ExpenseStatus.rejected,
  ExpenseStatus.forwarded,
] as const;

export class DecideExpenseDto {
  @IsEnum(ExpenseStatus)
  @IsIn(DECISION_VALUES as readonly ExpenseStatus[])
  decision!: typeof DECISION_VALUES[number];

  @IsOptional() @IsString()
  decisionNote?: string;
}
