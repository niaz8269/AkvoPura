import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeIdentifierDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  newIdentifier!: string;
}
