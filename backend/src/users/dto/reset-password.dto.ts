import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(4, { message: 'newPassword must be at least 4 characters' })
  newPassword!: string;
}
