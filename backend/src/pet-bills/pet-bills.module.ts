import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PetBillsService } from './pet-bills.service';
import { PetBillsController } from './pet-bills.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PassportModule, TripsModule],
  providers: [PetBillsService],
  controllers: [PetBillsController],
  exports: [PetBillsService],
})
export class PetBillsModule {}
