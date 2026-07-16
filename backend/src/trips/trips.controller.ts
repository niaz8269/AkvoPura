import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { TripsService } from './trips.service';
import { StartTripDto } from './dto/start-trip.dto';
import { EndTripDto } from './dto/end-trip.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const SALESMAN_ROLES = new Set(['cans_gallons_salesman', 'pets_salesman']);
const VIEW_ROLES = new Set([
  'owner',
  'manager',
  'cans_gallons_salesman',
  'pets_salesman',
]);

@Controller('trips')
@UseGuards(AuthGuard('jwt'))
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  /** Owner: any branch. Manager / salesman: own branch only. */
  private resolveBranch(me: JwtPayload, branchQ?: string) {
    if (me.role === 'owner') return branchQ;
    if (!me.branch) throw new ForbiddenException('No branch assigned');
    if (branchQ && branchQ !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return me.branch;
  }

  /** Currently-open trip for the calling salesman (or 404). */
  @Get('active')
  active(@Req() req: Request) {
    const me = req.user as JwtPayload;
    if (!SALESMAN_ROLES.has(me.role)) {
      throw new ForbiddenException('Salesman only');
    }
    return this.trips.activeForSalesman(me.sub);
  }

  @Post()
  start(@Req() req: Request, @Body() dto: StartTripDto) {
    const me = req.user as JwtPayload;
    if (!SALESMAN_ROLES.has(me.role)) {
      throw new ForbiddenException('Only salesmen start trips');
    }
    if (!me.branch) {
      throw new ForbiddenException('Salesman has no branch');
    }
    // Role vs assignment sanity check.
    if (dto.role === 'cg' && me.role !== 'cans_gallons_salesman') {
      throw new BadRequestException('CG trips only started by CG salesmen');
    }
    if (dto.role === 'pets' && me.role !== 'pets_salesman') {
      throw new BadRequestException('Pets trips only started by Pets salesmen');
    }
    return this.trips.start({
      salesmanId: me.sub,
      branchSlug: me.branch,
      role: dto.role,
      vehicleLabel: dto.vehicleLabel,
      initialCansLoaded: dto.initialCansLoaded,
      initialGallonsLoaded: dto.initialGallonsLoaded,
      initialPet600Packs: dto.initialPet600Packs,
      initialPet1500Packs: dto.initialPet1500Packs,
      notes: dto.notes,
    });
  }

  @Patch(':id/end')
  end(@Req() req: Request, @Param('id') id: string, @Body() dto: EndTripDto) {
    const me = req.user as JwtPayload;
    if (!SALESMAN_ROLES.has(me.role)) {
      throw new ForbiddenException('Only salesmen close trips');
    }
    return this.trips.end({
      tripId: id,
      actorId: me.sub,
      finalCansOnVan: dto.finalCansOnVan,
      finalGallonsOnVan: dto.finalGallonsOnVan,
      finalEmptyCansOnVan: dto.finalEmptyCansOnVan,
      finalEmptyGallonsOnVan: dto.finalEmptyGallonsOnVan,
      finalPet600Packs: dto.finalPet600Packs,
      finalPet1500Packs: dto.finalPet1500Packs,
      declaredCashOnHand: dto.declaredCashOnHand,
      notes: dto.notes,
    });
  }

  @Get()
  list(
    @Req() req: Request,
    @Query('branchSlug') branchSlug?: string,
    @Query('salesmanId') salesmanId?: string,
    @Query('date') date?: string,
    @Query('openOnly') openOnly?: string,
  ) {
    const me = req.user as JwtPayload;
    if (!VIEW_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    // Salesmen only see their own trips.
    const resolvedSalesman = SALESMAN_ROLES.has(me.role) ? me.sub : salesmanId;
    return this.trips.list({
      branchSlug: this.resolveBranch(me, branchSlug),
      salesmanId: resolvedSalesman,
      date,
      openOnly: openOnly === 'true',
    });
  }

  @Get(':id')
  async detail(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    if (!VIEW_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    const trip = await this.trips.detail(id);
    // Enforce branch scope for non-owner viewers.
    if (me.role !== 'owner' && trip.branchSlug !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    // Salesmen see only their own trips.
    if (SALESMAN_ROLES.has(me.role) && trip.salesmanId !== me.sub) {
      throw new ForbiddenException('Not your trip');
    }
    return trip;
  }
}
