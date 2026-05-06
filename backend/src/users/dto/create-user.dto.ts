import { Role } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9_.-]+$/i, {
    message: 'identifier must contain only letters, digits, underscore, dot or hyphen',
  })
  identifier!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(4, { message: 'password must be at least 4 characters' })
  password!: string;

  @IsEnum(Role)
  role!: Role;

  /** Required unless role is 'owner'. */
  @IsOptional()
  @IsString()
  @ValidateIf((o: CreateUserDto) => o.role !== Role.owner)
  branchSlug?: string;

  @IsOptional()
  @IsString()
  linkedCgCustomerId?: string;
}
