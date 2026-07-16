import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CGCollectionsService } from './cg-collections.service';
import { CGCollectionsController } from './cg-collections.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PassportModule, TripsModule],
  providers: [CGCollectionsService],
  controllers: [CGCollectionsController],
  exports: [CGCollectionsService],
})
export class CGCollectionsModule {}
