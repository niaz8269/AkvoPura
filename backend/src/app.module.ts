import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { PricingModule } from './pricing/pricing.module';
import { CGCustomersModule } from './cg-customers/cg-customers.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    BranchesModule,
    PricingModule,
    CGCustomersModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
