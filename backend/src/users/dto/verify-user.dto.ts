import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Manager-only payload for approving a pending customer registration.
 *
 * The manager fills in operational details that depend on the customer's
 * kind: CG customers need a route + payment cycle; Pets customers need
 * an area. Both kinds need an address. Optional price overrides let the
 * manager give the customer a custom price right away.
 */
export class VerifyUserDto {
  /** Required for both CG and Pets customers. */
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  address!: string;

  // ---- CG-only ----
  @IsOptional()
  @IsEnum(['hospital', 'bypass', 'others'])
  cgRoute?: 'hospital' | 'bypass' | 'others';

  @IsOptional()
  @IsEnum(['daily', 'weekly'])
  cgPaymentCycle?: 'daily' | 'weekly';

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerCan?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerGallon?: number;

  // ---- Pets-only ----
  @IsOptional()
  @IsString()
  @MaxLength(60)
  petArea?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePet600?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePet1500?: number;
}
