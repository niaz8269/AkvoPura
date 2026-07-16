import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CGDeliveriesService } from './cg-deliveries.service';
import { CGDeliveriesController } from './cg-deliveries.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PassportModule, TripsModule],
  providers: [CGDeliveriesService],
  controllers: [CGDeliveriesController],
  exports: [CGDeliveriesService],
})
export class CGDeliveriesModule {}
