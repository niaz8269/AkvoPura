import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, UsersModule],
  providers: [ComplaintsService],
  controllers: [ComplaintsController],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
