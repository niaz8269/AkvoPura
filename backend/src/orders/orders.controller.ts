import {
  BadRequestException,
  Body,
  Controller,
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
import {
  CustomerOrderStatus,
  Role,
} from '@prisma/client';
import type { Request } from 'express';

import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly users: UsersService,
  ) {}

  /** Caller's own orders (works for any role — relevant mainly for customers). */
  @Get('mine')
  listMine(@Req() req: Request) {
    const me = req.user as JwtPayload;
    return this.orders.list({ customerUserId: me.sub });
  }

  /**
   * Branch-scoped order inbox.
   *  - Owner: any branch
   *  - Manager: own branch only
   *  - Salesman (pets/cans): own assigned ones in own branch
   *  - Customer: their own (use /orders/mine instead)
   */
  @Get()
  list(
    @Req() req: Request,
    @Query('branchSlug') branchSlugQ?: string,
    @Query('status') statusQ?: string,
  ) {
    const me = req.user as JwtPayload;
    let status: CustomerOrderStatus | undefined;
    if (statusQ) {
      if (!Object.values(CustomerOrderStatus).includes(statusQ as CustomerOrderStatus)) {
        throw new BadRequestException(`Unknown status: ${statusQ}`);
      }
      status = statusQ as CustomerOrderStatus;
    }

    if (me.role === Role.owner) {
      return this.orders.list({ branchSlug: branchSlugQ, status });
    }
    if (me.role === Role.manager) {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      if (branchSlugQ && branchSlugQ !== me.branch) {
        throw new ForbiddenException('Cannot list other branch orders');
      }
      return this.orders.list({ branchSlug: me.branch, status });
    }
    if (me.role === Role.cans_gallons_salesman || me.role === Role.pets_salesman) {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      return this.orders.list({
        branchSlug: me.branch,
        assignedSalesmanId: me.sub,
        status,
      });
    }
    if (me.role === Role.customer) {
      return this.orders.list({ customerUserId: me.sub });
    }
    throw new ForbiddenException('Insufficient privileges');
  }

  @Post()
  async place(@Req() req: Request, @Body() dto: PlaceOrderDto) {
    const me = req.user as JwtPayload;

    let branchSlug: string;
    if (dto.branchSlug) {
      if (me.role !== Role.owner && dto.branchSlug !== me.branch) {
        throw new ForbiddenException('Cannot place orders in another branch');
      }
      branchSlug = dto.branchSlug;
    } else {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      branchSlug = me.branch;
    }

    const customer = await this.users.findById(me.sub);
    if (!customer) throw new ForbiddenException('User not found');

    return this.orders.place({
      branchSlug,
      customerUserId: me.sub,
      customerName: customer.name,
      items: dto.items,
      preferredTime: dto.preferredTime,
      notes: dto.notes,
    });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    const me = req.user as JwtPayload;
    const target = await this.orders.findById(id);
    if (!target) throw new NotFoundException('Order not found');

    // Branch scoping for non-owner roles.
    if (me.role !== Role.owner && me.branch !== target.branchSlug) {
      throw new ForbiddenException('Order is in another branch');
    }

    // Role-specific allowed transitions:
    if (me.role === Role.customer) {
      // Customer can only cancel their own pending order.
      if (target.customerUserId !== me.sub) {
        throw new ForbiddenException('Not your order');
      }
      if (dto.status !== CustomerOrderStatus.cancelled) {
        throw new ForbiddenException('Customer can only cancel own pending orders');
      }
      if (target.status !== CustomerOrderStatus.pending) {
        throw new BadRequestException('Order is no longer pending');
      }
      return this.orders.update(id, me.sub, { status: CustomerOrderStatus.cancelled });
    }

    if (me.role === Role.cans_gallons_salesman || me.role === Role.pets_salesman) {
      // Salesman can move assigned/in_transit ones forward.
      if (target.assignedSalesmanId !== me.sub) {
        throw new ForbiddenException('Order is not assigned to you');
      }
      if (
        dto.status !== CustomerOrderStatus.in_transit &&
        dto.status !== CustomerOrderStatus.delivered
      ) {
        throw new ForbiddenException('Salesman can only mark in-transit or delivered');
      }
      return this.orders.update(id, me.sub, { status: dto.status });
    }

    if (me.role === Role.manager || me.role === Role.owner) {
      // Manager / owner can do anything: assign, update status, add note.
      const data: Parameters<typeof this.orders.update>[2] = {};
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.managerNote !== undefined) data.managerNote = dto.managerNote;
      if (dto.assignedSalesmanId !== undefined) {
        // Look up the salesman to snapshot the name + auto-set status.
        const sm = await this.users.findById(dto.assignedSalesmanId);
        if (!sm) throw new BadRequestException('Salesman not found');
        if (sm.branchSlug !== target.branchSlug) {
          throw new BadRequestException('Salesman is in a different branch');
        }
        data.assignedSalesmanId = dto.assignedSalesmanId;
        data.assignedSalesmanName = sm.name;
        if (data.status === undefined) {
          data.status = CustomerOrderStatus.assigned;
        }
      }
      return this.orders.update(id, me.sub, data);
    }

    throw new ForbiddenException('Insufficient privileges');
  }
}
