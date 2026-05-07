import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { PetBillsService } from './pet-bills.service';
import { RecordBillDto } from './dto/record-bill.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const VIEW_ROLES = new Set(['owner', 'manager', 'pets_salesman']);
const RECORD_ROLES = new Set(['pets_salesman', 'manager', 'owner']);

@Controller('pets/bills')
@UseGuards(AuthGuard('jwt'))
export class PetBillsController {
  constructor(private readonly bills: PetBillsService) {}

  private resolveBranch(me: JwtPayload, branchQ?: string) {
    if (me.role === 'owner') return branchQ;
    if (!me.branch) throw new ForbiddenException('No branch assigned');
    if (branchQ && branchQ !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return me.branch;
  }

  @Get()
  list(
    @Req() req: Request,
    @Query('branchSlug') branchSlug?: string,
    @Query('salesmanId') salesmanId?: string,
    @Query('date') date?: string,
  ) {
    const me = req.user as JwtPayload;
    if (!VIEW_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.bills.list({
      branchSlug: this.resolveBranch(me, branchSlug),
      salesmanId,
      date,
    });
  }

  @Post()
  record(@Req() req: Request, @Body() dto: RecordBillDto) {
    const me = req.user as JwtPayload;
    if (!RECORD_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.bills.record({ ...dto, salesmanId: me.sub });
  }

  @Post(':id/undo')
  undo(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    if (!RECORD_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.bills.undo(id, me.sub);
  }
}
