import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { PricingModule } from './pricing/pricing.module';
import { CGCustomersModule } from './cg-customers/cg-customers.module';
import { CGDeliveriesModule } from './cg-deliveries/cg-deliveries.module';
import { CGCollectionsModule } from './cg-collections/cg-collections.module';
import { PetCustomersModule } from './pet-customers/pet-customers.module';
import { PetBillsModule } from './pet-bills/pet-bills.module';
import { PetReturnsModule } from './pet-returns/pet-returns.module';
import { ExpensesModule } from './expenses/expenses.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    BranchesModule,
    PricingModule,
    CGCustomersModule,
    CGDeliveriesModule,
    CGCollectionsModule,
    PetCustomersModule,
    PetBillsModule,
    PetReturnsModule,
    ExpensesModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
