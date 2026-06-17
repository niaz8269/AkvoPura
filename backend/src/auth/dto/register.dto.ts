import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Customer self-registration payload. Creates a User with role=customer,
 * verified=false. The customer's branch manager approves the registration
 * later via POST /users/:id/verify.
 */
export class RegisterDto {
  /** Login name the customer picks (e.g. their phone number). */
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  identifier!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  password!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  phone!: string;

  /** Which branch the customer belongs to. */
  @IsString()
  @MinLength(2)
  branchSlug!: string;

  /** Which kind of customer they'll be once verified. */
  @IsEnum(['cg', 'pets'])
  customerKind!: 'cg' | 'pets';

  /** Optional — manager will usually set this at verify time, but the customer
   *  can pre-fill it during registration. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}
