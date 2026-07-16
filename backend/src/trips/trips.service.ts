import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type StartTripParams = {
  salesmanId: string;
  branchSlug: string;
  role: TripRole;
  vehicleLabel: string;
  initialCansLoaded?: number;
  initialGallonsLoaded?: number;
  initialPet600Packs?: number;
  initialPet1500Packs?: number;
  notes?: string;
};

export type EndTripParams = {
  tripId: string;
  actorId: string;
  finalCansOnVan?: number;
  finalGallonsOnVan?: number;
  finalEmptyCansOnVan?: number;
  finalEmptyGallonsOnVan?: number;
  finalPet600Packs?: number;
  finalPet1500Packs?: number;
  declaredCashOnHand?: number;
  notes?: string;
};

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the currently-open trip for a salesman, or null. */
  activeForSalesman(salesmanId: string) {
    return this.prisma.trip.findFirst({
      where: { salesmanId, closedAt: null },
      orderBy: { openedAt: 'desc' },
    });
  }

  /** Guard used by delivery/collection/bill/return record endpoints:
   *  loads the trip, throws if closed or not owned by the salesman. */
  async requireOpenTripForSalesman(tripId: string, salesmanId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.salesmanId !== salesmanId) {
      throw new ForbiddenException('Trip belongs to another salesman');
    }
    if (trip.closedAt) {
      throw new BadRequestException('Trip is already closed');
    }
    return trip;
  }

  async start(params: StartTripParams) {
    const label = params.vehicleLabel.trim();
    if (label.length < 2) {
      throw new BadRequestException('Vehicle label is required (min 2 chars)');
    }

    // Guard: refuse a second open trip for the same salesman. They must
    // end the current one before starting a new one.
    const active = await this.activeForSalesman(params.salesmanId);
    if (active) {
      throw new ConflictException(
        `Salesman already has an active trip (${active.vehicleLabel}). End it before starting a new one.`,
      );
    }

    return this.prisma.trip.create({
      data: {
        salesmanId: params.salesmanId,
        branchSlug: params.branchSlug,
        role: params.role,
        vehicleLabel: label,
        initialCansLoaded: params.initialCansLoaded ?? 0,
        initialGallonsLoaded: params.initialGallonsLoaded ?? 0,
        initialPet600Packs: params.initialPet600Packs ?? 0,
        initialPet1500Packs: params.initialPet1500Packs ?? 0,
        notes: params.notes,
      },
    });
  }

  async end(params: EndTripParams) {
    const trip = await this.prisma.trip.findUnique({ where: { id: params.tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.closedAt) throw new BadRequestException('Trip already closed');
    if (trip.salesmanId !== params.actorId) {
      throw new ForbiddenException('Only the trip owner can close it');
    }
    return this.prisma.trip.update({
      where: { id: params.tripId },
      data: {
        closedAt: new Date(),
        finalCansOnVan: params.finalCansOnVan,
        finalGallonsOnVan: params.finalGallonsOnVan,
        finalEmptyCansOnVan: params.finalEmptyCansOnVan,
        finalEmptyGallonsOnVan: params.finalEmptyGallonsOnVan,
        finalPet600Packs: params.finalPet600Packs,
        finalPet1500Packs: params.finalPet1500Packs,
        declaredCashOnHand: params.declaredCashOnHand,
        notes: params.notes ?? trip.notes,
      },
    });
  }

  /** List trips, optionally scoped by branch / salesman / date. */
  list(params: {
    branchSlug?: string;
    salesmanId?: string;
    date?: string; // yyyy-mm-dd
    openOnly?: boolean;
  } = {}) {
    let dateRange: { gte: Date; lt: Date } | undefined;
    if (params.date) {
      const start = new Date(`${params.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException('Bad date');
      const end = new Date(start.getTime() + 24 * 60 * 60_000);
      dateRange = { gte: start, lt: end };
    }
    return this.prisma.trip.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.salesmanId ? { salesmanId: params.salesmanId } : {}),
        ...(dateRange ? { openedAt: dateRange } : {}),
        ...(params.openOnly ? { closedAt: null } : {}),
      },
      include: {
        salesman: { select: { id: true, name: true, role: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  /** Detail view: trip + all its activity, in one shot. */
  async detail(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        salesman: { select: { id: true, name: true, role: true } },
        deliveries: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { loggedAt: 'asc' },
        },
        collections: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { loggedAt: 'asc' },
        },
        bills: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { loggedAt: 'asc' },
        },
        returns: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { loggedAt: 'asc' },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }
}
