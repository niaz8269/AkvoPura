import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ArchiveBillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  customerName!: string;

  @IsEnum(['Pets', 'Cans/Gallons'])
  customerType!: 'Pets' | 'Cans/Gallons';

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  branchName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  salesmanName?: string;

  @IsInt() @Min(0)
  totalRs!: number;

  @IsInt() @Min(0)
  paidRs!: number;

  @IsInt() @Min(0)
  creditRs!: number;

  @IsString()
  @MaxLength(400)
  itemsSummary!: string;

  /** Base64 PDF bytes (no data: URL prefix). Optional — service emails a
   *  plain text summary if missing. */
  @IsOptional()
  @IsString()
  pdfBase64?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pdfFilename?: string;
}
