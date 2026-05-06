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

import { CGDeliveriesService } from './cg-deliveries.service';
import { RecordDeliveryDto } from './dto/record-delivery.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const VIEW_ROLES = new Set(['owner', 'manager', 'cans_gallons_salesman']);
const RECORD_ROLES = new Set(['cans_gallons_salesman', 'manager', 'owner']);

@Controller('cg/deliveries')
@UseGuards(AuthGuard('jwt'))
export class CGDeliveriesController {
  constructor(private readonly deliveries: CGDeliveriesService) {}

  /** Owner: anywhere. Manager / salesman: own branch only. */
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
    return this.deliveries.list({
      branchSlug: this.resolveBranch(me, branchSlug),
      salesmanId,
      date,
    });
  }

  @Post()
  record(@Req() req: Request, @Body() dto: RecordDeliveryDto) {
    const me = req.user as JwtPayload;
    if (!RECORD_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.deliveries.record({
      ...dto,
      salesmanId: me.sub,
    });
  }

  @Post(':id/undo')
  undo(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    if (!RECORD_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.deliveries.undo(id, me.sub);
  }
}
