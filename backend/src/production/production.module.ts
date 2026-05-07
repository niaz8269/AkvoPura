import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, UsersModule],
  providers: [ProductionService],
  controllers: [ProductionController],
  exports: [ProductionService],
})
export class ProductionModule {}
