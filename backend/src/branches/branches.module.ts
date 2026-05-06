import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';

@Module({
  imports: [PassportModule],
  providers: [BranchesService],
  controllers: [BranchesController],
  exports: [BranchesService],
})
export class BranchesModule {}
