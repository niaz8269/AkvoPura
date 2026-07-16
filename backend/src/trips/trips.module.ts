import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
  imports: [PassportModule],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
