import { IsString, MinLength } from 'class-validator';

export class PostCommentDto {
  @IsString() @MinLength(1)
  body!: string;
}
