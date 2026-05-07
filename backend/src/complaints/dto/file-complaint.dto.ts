import { ComplaintCategory, ComplaintRecipient } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class FileComplaintDto {
  @IsEnum(ComplaintCategory)
  category!: ComplaintCategory;

  @IsEnum(ComplaintRecipient)
  recipient!: ComplaintRecipient;

  @IsString() @MinLength(2)
  description!: string;

  @IsOptional() @IsString()
  branchSlug?: string;
}
