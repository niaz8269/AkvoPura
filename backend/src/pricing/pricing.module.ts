import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [PassportModule],
  providers: [PricingService],
  controllers: [PricingController],
  exports: [PricingService],
})
export class PricingModule {}
