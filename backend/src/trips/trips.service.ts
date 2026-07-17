import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type PrepareTripParams = {
  salesmanId: string;
  /** Optional gate — if set (manager), rejects prepping into another
   *  branch. Owner leaves this null to allow cross-branch prep. */
  gateBranchSlug?: string;
  role: TripRole;
  vehicleLabel: string;
  initialCansLoaded?: number;
  initialGallonsLoaded?: number;
  initialPet600Packs?: number;
  initialPet1500Packs?: number;
  notes?: string;
  preparedById: string;
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

  /** Currently-open trip for a salesman (started, not yet closed). */
  activeForSalesman(salesmanId: string) {
    return this.prisma.trip.findFirst({
      where: {
        salesmanId,
        openedAt: { not: null },
        closedAt: null,
        cancelledAt: null,
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  /** Prepared trips waiting for this salesman to start. Sorted oldest-first
   *  so the salesman naturally picks up the earliest assignment first. */
  assignedForSalesman(salesmanId: string) {
    return this.prisma.trip.findMany({
      where: {
        salesmanId,
        openedAt: null,
        cancelledAt: null,
      },
      include: {
        salesman: { select: { id: true, name: true, role: true } },
      },
      orderBy: { preparedAt: 'asc' },
    });
  }

  /** Guard used by delivery/collection/bill/return record endpoints:
   *  loads the trip, throws if not started / closed / not owned. */
  async requireOpenTripForSalesman(tripId: string, salesmanId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.salesmanId !== salesmanId) {
      throw new ForbiddenException('Trip belongs to another salesman');
    }
    if (trip.cancelledAt) throw new BadRequestException('Trip was cancelled');
    if (!trip.openedAt) throw new BadRequestException('Trip has not been started yet');
    if (trip.closedAt) throw new BadRequestException('Trip is already closed');
    return trip;
  }

  /** MANAGER: prepare a trip assignment for a salesman. Creates the trip
   *  in "waiting" state (openedAt = null). Salesman activates it later. */
  async prepare(params: PrepareTripParams) {
    const label = params.vehicleLabel.trim();
    if (label.length < 2) {
      throw new BadRequestException('Vehicle label is required (min 2 chars)');
    }
    // Sanity: does the salesman exist and match the role?
    const salesman = await this.prisma.user.findUnique({
      where: { id: params.salesmanId },
      select: { id: true, role: true, branchSlug: true, active: true },
    });
    if (!salesman) throw new NotFoundException('Salesman not found');
    if (!salesman.active) throw new BadRequestException('Salesman account is inactive');
    if (!salesman.branchSlug) {
      throw new BadRequestException('Salesman has no branch assigned');
    }
    // Manager can only prep in their own branch; owner has no gate.
    if (params.gateBranchSlug && salesman.branchSlug !== params.gateBranchSlug) {
      throw new BadRequestException('Cannot prepare trip for salesman in another branch');
    }
    if (params.role === 'cg' && salesman.role !== 'cans_gallons_salesman') {
      throw new BadRequestException('This salesman is not a CG salesman');
    }
    if (params.role === 'pets' && salesman.role !== 'pets_salesman') {
      throw new BadRequestException('This salesman is not a Pets salesman');
    }

    return this.prisma.trip.create({
      data: {
        salesmanId: params.salesmanId,
        branchSlug: salesman.branchSlug,
        role: params.role,
        vehicleLabel: label,
        initialCansLoaded: params.initialCansLoaded ?? 0,
        initialGallonsLoaded: params.initialGallonsLoaded ?? 0,
        initialPet600Packs: params.initialPet600Packs ?? 0,
        initialPet1500Packs: params.initialPet1500Packs ?? 0,
        notes: params.notes,
        preparedById: params.preparedById,
        // preparedAt defaults to now; openedAt stays null until salesman starts.
      },
    });
  }

  /** SALESMAN: activate a prepared trip. Guard: no other open trip. */
  async start(tripId: string, salesmanId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.salesmanId !== salesmanId) {
      throw new ForbiddenException('Trip belongs to another salesman');
    }
    if (trip.cancelledAt) throw new BadRequestException('Trip was cancelled');
    if (trip.closedAt) throw new BadRequestException('Trip already closed');
    if (trip.openedAt) return trip; // idempotent — already started

    const active = await this.activeForSalesman(salesmanId);
    if (active) {
      throw new ConflictException(
        `You already have an active trip (${active.vehicleLabel}). End it before starting the next one.`,
      );
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { openedAt: new Date() },
    });
  }

  /** MANAGER: cancel a prepared trip before the salesman starts it. */
  async cancel(tripId: string, actorId: string, note?: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.openedAt) {
      throw new BadRequestException(
        'Trip is already in progress — the salesman must end it via reconciliation',
      );
    }
    if (trip.closedAt) throw new BadRequestException('Trip already closed');
    if (trip.cancelledAt) return trip; // idempotent
    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        cancelledAt: new Date(),
        notes: note ? `${trip.notes ?? ''}\nCancelled by ${actorId}: ${note}`.trim() : trip.notes,
      },
    });
  }

  async end(params: EndTripParams) {
    const trip = await this.prisma.trip.findUnique({ where: { id: params.tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.cancelledAt) throw new BadRequestException('Trip was cancelled');
    if (trip.closedAt) throw new BadRequestException('Trip already closed');
    if (!trip.openedAt) throw new BadRequestException('Trip has not been started yet');
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

  /** List trips, optionally scoped by branch / salesman / date / state. */
  list(params: {
    branchSlug?: string;
    salesmanId?: string;
    date?: string; // yyyy-mm-dd — filters on preparedAt
    state?: 'prepared' | 'active' | 'closed' | 'cancelled';
  } = {}) {
    let dateRange: { gte: Date; lt: Date } | undefined;
    if (params.date) {
      const start = new Date(`${params.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException('Bad date');
      const end = new Date(start.getTime() + 24 * 60 * 60_000);
      dateRange = { gte: start, lt: end };
    }
    const stateWhere =
      params.state === 'prepared'
        ? { openedAt: null, cancelledAt: null }
        : params.state === 'active'
          ? { openedAt: { not: null }, closedAt: null, cancelledAt: null }
          : params.state === 'closed'
            ? { closedAt: { not: null } }
            : params.state === 'cancelled'
              ? { cancelledAt: { not: null } }
              : {};

    return this.prisma.trip.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.salesmanId ? { salesmanId: params.salesmanId } : {}),
        ...(dateRange ? { preparedAt: dateRange } : {}),
        ...stateWhere,
      },
      include: {
        salesman: { select: { id: true, name: true, role: true } },
      },
      orderBy: { preparedAt: 'desc' },
    });
  }

  /** Detail view: trip + all its activity + linked expenses, in one shot. */
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
        expenses: {
          orderBy: { submittedAt: 'asc' },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }
}
