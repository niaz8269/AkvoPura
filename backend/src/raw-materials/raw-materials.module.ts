import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';

@Module({
  imports: [PassportModule],
  providers: [RawMaterialsService],
  controllers: [RawMaterialsController],
  exports: [RawMaterialsService],
})
export class RawMaterialsModule {}
