import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type RecordCollectionParams = {
  customerId: string;
  salesmanId: string;
  cansCollected: number;
  gallonsCollected: number;
  tripNumber?: number;
};

@Injectable()
export class CGCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { branchSlug?: string; salesmanId?: string; date?: string } = {}) {
    let dateRange: { gte: Date; lt: Date } | undefined;
    if (params.date) {
      const start = new Date(`${params.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('Bad date');
      }
      const end = new Date(start.getTime() + 24 * 60 * 60_000);
      dateRange = { gte: start, lt: end };
    }
    return this.prisma.cGCollection.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.salesmanId ? { salesmanId: params.salesmanId } : {}),
        ...(dateRange ? { loggedAt: dateRange } : {}),
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Atomic: insert collection row + decrement customer's empties. */
  async record(params: RecordCollectionParams) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.cGCustomer.findUnique({
        where: { id: params.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      await tx.cGCustomer.update({
        where: { id: customer.id },
        data: {
          emptyCansHeld: Math.max(0, customer.emptyCansHeld - params.cansCollected),
          emptyGallonsHeld: Math.max(0, customer.emptyGallonsHeld - params.gallonsCollected),
        },
      });

      return tx.cGCollection.create({
        data: {
          customerId: customer.id,
          salesmanId: params.salesmanId,
          branchSlug: customer.branchSlug,
          cansCollected: params.cansCollected,
          gallonsCollected: params.gallonsCollected,
          tripNumber: params.tripNumber ?? 1,
        },
      });
    });
  }

  /** Reverse a collection and delete it. Same-day, same-salesman only. */
  async undo(id: string, salesmanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.cGCollection.findUnique({ where: { id } });
      if (!c) throw new NotFoundException('Collection not found');
      if (c.salesmanId !== salesmanId) {
        throw new ForbiddenException('Cannot undo someone else\'s collection');
      }
      const sameDay = isSameDay(c.loggedAt, new Date());
      if (!sameDay) {
        throw new BadRequestException('Can only undo today\'s collections');
      }

      const customer = await tx.cGCustomer.findUnique({ where: { id: c.customerId } });
      if (!customer) throw new NotFoundException('Customer not found');

      await tx.cGCustomer.update({
        where: { id: customer.id },
        data: {
          emptyCansHeld: customer.emptyCansHeld + c.cansCollected,
          emptyGallonsHeld: customer.emptyGallonsHeld + c.gallonsCollected,
        },
      });

      await tx.cGCollection.delete({ where: { id } });
      return c;
    });
  }
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
