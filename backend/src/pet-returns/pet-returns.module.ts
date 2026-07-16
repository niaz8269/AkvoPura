import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PetReturnsService } from './pet-returns.service';
import { PetReturnsController } from './pet-returns.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PassportModule, TripsModule],
  providers: [PetReturnsService],
  controllers: [PetReturnsController],
  exports: [PetReturnsService],
})
export class PetReturnsModule {}
