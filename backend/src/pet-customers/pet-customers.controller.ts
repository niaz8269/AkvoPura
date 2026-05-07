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

import { PetCustomersService } from './pet-customers.service';
import { CreatePetCustomerDto } from './dto/create-pet-customer.dto';
import { UpdatePetCustomerDto } from './dto/update-pet-customer.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const ALLOWED_ROLES = new Set(['owner', 'manager', 'pets_salesman']);

@Controller('pets/customers')
@UseGuards(AuthGuard('jwt'))
export class PetCustomersController {
  constructor(private readonly customers: PetCustomersService) {}

  /** Customer self-service: fetch the calling customer's own linked
   *  Pets customer record. Returns null if not linked yet. */
  @Get('me')
  myRecord(@Req() req: Request) {
    const me = req.user as JwtPayload;
    if (me.role !== 'customer') {
      throw new ForbiddenException('Customers only');
    }
    return this.customers.findForUser(me.sub);
  }

  private assertCanAccess(me: JwtPayload) {
    if (!ALLOWED_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
  }

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
    this.resolveScope(me, c.branchSlug);
    return c;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreatePetCustomerDto) {
    const me = req.user as JwtPayload;
    this.assertCanAccess(me);
    this.resolveScope(me, dto.branchSlug);
    return this.customers.create(dto);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdatePetCustomerDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertCanAccess(me);
    const target = await this.customers.findById(id);
    if (!target) throw new NotFoundException('Customer not found');
    this.resolveScope(me, target.branchSlug);
    return this.customers.update(id, dto);
  }
}
