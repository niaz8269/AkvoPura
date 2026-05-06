import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CGCollectionsService } from './cg-collections.service';
import { CGCollectionsController } from './cg-collections.controller';

@Module({
  imports: [PassportModule],
  providers: [CGCollectionsService],
  controllers: [CGCollectionsController],
  exports: [CGCollectionsService],
})
export class CGCollectionsModule {}
