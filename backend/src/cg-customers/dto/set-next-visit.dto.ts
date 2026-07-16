import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SetNextVisitDto {
  /** YYYY-MM-DD local date the intent applies to. Pass null to clear. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'nextVisitDate must be YYYY-MM-DD' })
  nextVisitDate?: string | null;

  @IsOptional() @IsBoolean()
  nextVisitSkip?: boolean | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  nextVisitCans?: number | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  nextVisitGallons?: number | null;

  @IsOptional() @IsString() @MaxLength(300)
  nextVisitNote?: string | null;
}
