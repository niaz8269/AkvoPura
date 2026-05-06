import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { PricingService } from './pricing.service';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('pricing')
@UseGuards(AuthGuard('jwt'))
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  /** Anyone authenticated can read pricing — needed for bills + dropdowns. */
  @Get()
  get() {
    return this.pricing.get();
  }

  /** Owner only. */
  @Patch()
  update(@Req() req: Request, @Body() dto: UpdatePricingDto) {
    const me = req.user as JwtPayload;
    if (me.role !== 'owner') {
      throw new ForbiddenException('Only the owner can change pricing');
    }
    return this.pricing.update(dto, me.sub);
  }
}
