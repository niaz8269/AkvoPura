import {
  BadRequestException,
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

import { ProductionService } from './production.service';
import { RecordBatchDto } from './dto/record-batch.dto';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../auth/jwt.strategy';

const VIEW_ROLES = new Set(['owner', 'manager', 'production_worker']);
const RECORD_ROLES = new Set(['owner', 'manager', 'production_worker']);

@Controller('production/batches')
@UseGuards(AuthGuard('jwt'))
export class ProductionController {
  constructor(
    private readonly production: ProductionService,
    private readonly users: UsersService,
  ) {}

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
    @Query('date') date?: string,
  ) {
    const me = req.user as JwtPayload;
    if (!VIEW_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.production.list({
      branchSlug: this.resolveBranch(me, branchSlug),
      date,
    });
  }

  @Post()
  async record(@Req() req: Request, @Body() dto: RecordBatchDto) {
    const me = req.user as JwtPayload;
    if (!RECORD_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }

    let branchSlug = dto.branchSlug;
    if (!branchSlug) {
      if (me.role === 'owner') {
        throw new BadRequestException('Owner must specify branchSlug');
      }
      branchSlug = me.branch ?? undefined;
      if (!branchSlug) throw new ForbiddenException('No branch assigned');
    } else {
      this.resolveBranch(me, branchSlug);
    }

    const submitter = await this.users.findById(me.sub);
    if (!submitter) throw new ForbiddenException('User not found');

    return this.production.record({
      branchSlug,
      product: dto.product,
      unitsProduced: dto.unitsProduced,
      batchNumber: dto.batchNumber,
      tdsPpm: dto.tdsPpm,
      phLevel: dto.phLevel,
      wastage: dto.wastage,
      notes: dto.notes,
      loggedById: me.sub,
      loggedByName: submitter.name,
    });
  }

  @Post(':id/undo')
  undo(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    if (!RECORD_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    return this.production.undo(id, me.sub);
  }
}
