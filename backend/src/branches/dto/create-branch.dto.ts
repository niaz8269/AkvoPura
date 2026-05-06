import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must be lowercase letters, digits, underscore or hyphen',
  })
  slug!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  nameUr?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
