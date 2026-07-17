import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { UsersModule } from '../users/users.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PassportModule, UsersModule, TripsModule],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
