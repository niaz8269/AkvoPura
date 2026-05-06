import {
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
import type { Request } from 'express';

import { CGCustomersService } from './cg-customers.service';
import { CreateCGCustomerDto } from './dto/create-cg-customer.dto';
import { UpdateCGCustomerDto } from './dto/update-cg-customer.dto';
import { ChargeLossDto } from './dto/charge-loss.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const ALLOWED_ROLES = new Set(['owner', 'manager', 'cans_gallons_salesman']);

@Controller('cg/customers')
@UseGuards(AuthGuard('jwt'))
export class CGCustomersController {
  constructor(private readonly customers: CGCustomersService) {}

  private assertCanAccess(me: JwtPayload) {
    if (!ALLOWED_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
  }

  /** Owner: anywhere. Manager + salesman: only their own branch. */
  private resolveScope(me: JwtPayload, branchQ?: string): string | undefined {
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
    @Query('includeInactive') includeInactive?: string,
  ) {
    const me = req.user as JwtPayload;
    this.assertCanAccess(me);
    return this.customers.list({
      branchSlug: this.resolveScope(me, branchSlug),
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  async byId(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    this.assertCanAccess(me);
    const c = await this.customers.findById(id);
    if (!c) throw new NotFoundException('Customer not found');
    this.resolveScope(me, c.branchSlug); // re-uses scope check
    return c;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCGCustomerDto) {
    const me = req.user as JwtPayload;
    this.assertCanAccess(me);
    this.resolveScope(me, dto.branchSlug);
    return this.customers.create(dto);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCGCustomerDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertCanAccess(me);
    const target = await this.customers.findById(id);
    if (!target) throw new NotFoundException('Customer not found');
    this.resolveScope(me, target.branchSlug);
    return this.customers.update(id, dto);
  }

  @Post(':id/charge-loss')
  async chargeLoss(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ChargeLossDto,
  ) {
    const me = req.user as JwtPayload;
    if (me.role !== 'owner' && me.role !== 'manager') {
      throw new ForbiddenException('Only manager / owner can charge container loss');
    }
    const target = await this.customers.findById(id);
    if (!target) throw new NotFoundException('Customer not found');
    this.resolveScope(me, target.branchSlug);
    return this.customers.chargeLoss(id, dto.cans, dto.gallons, dto.totalCharge);
  }
}
