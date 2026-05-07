import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PetReturnsService } from './pet-returns.service';
import { PetReturnsController } from './pet-returns.controller';

@Module({
  imports: [PassportModule],
  providers: [PetReturnsService],
  controllers: [PetReturnsController],
  exports: [PetReturnsService],
})
export class PetReturnsModule {}
