import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PetCustomersService } from './pet-customers.service';
import { PetCustomersController } from './pet-customers.controller';

@Module({
  imports: [PassportModule],
  providers: [PetCustomersService],
  controllers: [PetCustomersController],
  exports: [PetCustomersService],
})
export class PetCustomersModule {}
