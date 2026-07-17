import {
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
import { PrepareTripDto } from './dto/prepare-trip.dto';
import { EndTripDto } from './dto/end-trip.dto';
import { CancelTripDto } from './dto/cancel-trip.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const SALESMAN_ROLES = new Set(['cans_gallons_salesman', 'pets_salesman']);
const PREPARE_ROLES = new Set(['manager', 'owner']);
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

  private resolveBranch(me: JwtPayload, branchQ?: string) {
    if (me.role === 'owner') return branchQ;
    if (!me.branch) throw new ForbiddenException('No branch assigned');
    if (branchQ && branchQ !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return me.branch;
  }

  /** Currently-open trip for the calling salesman (or null). */
  @Get('active')
  active(@Req() req: Request) {
    const me = req.user as JwtPayload;
    if (!SALESMAN_ROLES.has(me.role)) {
      throw new ForbiddenException('Salesman only');
    }
    return this.trips.activeForSalesman(me.sub);
  }

  /** Prepared trips waiting for the calling salesman to start. */
  @Get('assigned')
  assigned(@Req() req: Request) {
    const me = req.user as JwtPayload;
    if (!SALESMAN_ROLES.has(me.role)) {
      throw new ForbiddenException('Salesman only');
    }
    return this.trips.assignedForSalesman(me.sub);
  }

  /** MANAGER (or Owner) prepares a trip assignment for a salesman. */
  @Post('prepare')
  prepare(@Req() req: Request, @Body() dto: PrepareTripDto) {
    const me = req.user as JwtPayload;
    if (!PREPARE_ROLES.has(me.role)) {
      throw new ForbiddenException('Only manager / owner can prepare trips');
    }
    return this.trips.prepare({
      salesmanId: dto.salesmanId,
      gateBranchSlug: me.role === 'manager' ? me.branch ?? undefined : undefined,
      role: dto.role,
      vehicleLabel: dto.vehicleLabel,
      initialCansLoaded: dto.initialCansLoaded,
      initialGallonsLoaded: dto.initialGallonsLoaded,
      initialPet600Packs: dto.initialPet600Packs,
      initialPet1500Packs: dto.initialPet1500Packs,
      notes: dto.notes,
      preparedById: me.sub,
    });
  }

  /** SALESMAN activates a prepared trip. Zero data entry. */
  @Post(':id/start')
  start(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    if (!SALESMAN_ROLES.has(me.role)) {
      throw new ForbiddenException('Only salesmen start trips');
    }
    return this.trips.start(id, me.sub);
  }

  /** MANAGER cancels a prepared trip before it's started. */
  @Post(':id/cancel')
  cancel(@Req() req: Request, @Param('id') id: string, @Body() dto: CancelTripDto) {
    const me = req.user as JwtPayload;
    if (!PREPARE_ROLES.has(me.role)) {
      throw new ForbiddenException('Only manager / owner can cancel trips');
    }
    return this.trips.cancel(id, me.sub, dto.note);
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
    @Query('state') state?: 'prepared' | 'active' | 'closed' | 'cancelled',
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
      state,
    });
  }

  @Get(':id')
  async detail(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    if (!VIEW_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }
    const trip = await this.trips.detail(id);
    if (me.role !== 'owner' && trip.branchSlug !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    if (SALESMAN_ROLES.has(me.role) && trip.salesmanId !== me.sub) {
      throw new ForbiddenException('Not your trip');
    }
    return trip;
  }
}
