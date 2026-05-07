import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import type { Request } from 'express';

import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(
    private readonly subs: SubscriptionsService,
    private readonly users: UsersService,
  ) {}

  /** Customer's own subscriptions. */
  @Get('mine')
  listMine(@Req() req: Request) {
    const me = req.user as JwtPayload;
    return this.subs.list({ customerUserId: me.sub });
  }

  /**
   * Branch-scoped list.
   *  - Owner: any branch (or pass ?branchSlug=)
   *  - Manager: own branch only
   *  - Customer: use /subscriptions/mine
   */
  @Get()
  list(@Req() req: Request, @Query('branchSlug') branchSlugQ?: string) {
    const me = req.user as JwtPayload;

    if (me.role === Role.owner) {
      return this.subs.list({ branchSlug: branchSlugQ });
    }
    if (me.role === Role.manager) {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      if (branchSlugQ && branchSlugQ !== me.branch) {
        throw new ForbiddenException('Cannot list other branch subscriptions');
      }
      return this.subs.list({ branchSlug: me.branch });
    }
    if (me.role === Role.customer) {
      return this.subs.list({ customerUserId: me.sub });
    }
    throw new ForbiddenException('Insufficient privileges');
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateSubscriptionDto) {
    const me = req.user as JwtPayload;
    if (me.role !== Role.customer && me.role !== Role.owner) {
      throw new ForbiddenException('Only customers can create subscriptions');
    }

    let branchSlug: string;
    if (dto.branchSlug) {
      if (me.role !== Role.owner && dto.branchSlug !== me.branch) {
        throw new ForbiddenException('Cannot create in another branch');
      }
      branchSlug = dto.branchSlug;
    } else {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      branchSlug = me.branch;
    }

    const customer = await this.users.findById(me.sub);
    if (!customer) throw new ForbiddenException('User not found');

    return this.subs.create({
      branchSlug,
      customerUserId: me.sub,
      customerName: customer.name,
      items: dto.items,
      daysOfWeek: dto.daysOfWeek,
      preferredTime: dto.preferredTime,
      notes: dto.notes,
    });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    const me = req.user as JwtPayload;
    const target = await this.subs.findById(id);
    if (!target) throw new NotFoundException('Subscription not found');

    // Customers may only edit their own; managers/owner may edit branch-scoped.
    if (me.role === Role.customer) {
      if (target.customerUserId !== me.sub) {
        throw new ForbiddenException('Not your subscription');
      }
    } else if (me.role === Role.manager) {
      if (!me.branch || me.branch !== target.branchSlug) {
        throw new ForbiddenException('Subscription is in another branch');
      }
    } else if (me.role !== Role.owner) {
      throw new ForbiddenException('Insufficient privileges');
    }

    return this.subs.update(id, dto);
  }

  /**
   * Owner-only manual trigger for the daily generation cron. Useful for
   * verifying subscription setup without waiting for the next 6 AM
   * scheduled run, and for recovering if the server was down at 6 AM.
   *
   * Idempotent: subscriptions already generated today are skipped.
   */
  @Post('run-now')
  async runNow(@Req() req: Request) {
    const me = req.user as JwtPayload;
    if (me.role !== Role.owner) {
      throw new ForbiddenException('Owner only');
    }
    const ids = await this.subs.generateDueToday();
    return { generatedOrderIds: ids, count: ids.length };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    const target = await this.subs.findById(id);
    if (!target) throw new NotFoundException('Subscription not found');

    if (me.role === Role.customer) {
      if (target.customerUserId !== me.sub) {
        throw new ForbiddenException('Not your subscription');
      }
    } else if (me.role === Role.manager) {
      if (!me.branch || me.branch !== target.branchSlug) {
        throw new ForbiddenException('Subscription is in another branch');
      }
    } else if (me.role !== Role.owner) {
      throw new ForbiddenException('Insufficient privileges');
    }

    return this.subs.remove(id);
  }
}
