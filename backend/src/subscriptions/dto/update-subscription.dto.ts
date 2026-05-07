import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionItemDto } from './create-subscription.dto';

export class UpdateSubscriptionDto {
  @IsOptional() @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionItemDto)
  items?: SubscriptionItemDto[];

  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(7)
  @Type(() => Number) @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
  daysOfWeek?: number[];

  @IsOptional() @IsString()
  preferredTime?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}
