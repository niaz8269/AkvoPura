import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CGCustomersService } from './cg-customers.service';
import { CGCustomersController } from './cg-customers.controller';

@Module({
  imports: [PassportModule],
  providers: [CGCustomersService],
  controllers: [CGCustomersController],
  exports: [CGCustomersService],
})
export class CGCustomersModule {}
