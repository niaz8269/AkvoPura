import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type RecordDeliveryParams = {
  customerId: string;
  salesmanId: string;
  cansDelivered: number;
  gallonsDelivered: number;
  emptyCansCollected: number;
  emptyGallonsCollected: number;
  cashCollected: number;
  tripNumber?: number;
};

@Injectable()
export class CGDeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List deliveries — optionally scoped by branch / salesman / date.
   *  date is ISO yyyy-mm-dd; if omitted, no date filter. */
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
    return this.prisma.cGDelivery.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.salesmanId ? { salesmanId: params.salesmanId } : {}),
        ...(dateRange ? { loggedAt: dateRange } : {}),
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Atomic: insert delivery row + mutate the customer's balance. */
  async record(params: RecordDeliveryParams) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.cGCustomer.findUnique({
        where: { id: params.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const billed =
        params.cansDelivered * customer.pricePerCan +
        params.gallonsDelivered * customer.pricePerGallon;

      await tx.cGCustomer.update({
        where: { id: customer.id },
        data: {
          emptyCansHeld:
            customer.emptyCansHeld +
            params.cansDelivered -
            params.emptyCansCollected,
          emptyGallonsHeld:
            customer.emptyGallonsHeld +
            params.gallonsDelivered -
            params.emptyGallonsCollected,
          outstandingDebt: Math.max(
            0,
            customer.outstandingDebt + billed - params.cashCollected,
          ),
          lastActivityAt: new Date(),
        },
      });

      return tx.cGDelivery.create({
        data: {
          customerId: customer.id,
          salesmanId: params.salesmanId,
          branchSlug: customer.branchSlug,
          cansDelivered: params.cansDelivered,
          gallonsDelivered: params.gallonsDelivered,
          emptyCansCollected: params.emptyCansCollected,
          emptyGallonsCollected: params.emptyGallonsCollected,
          cashCollected: params.cashCollected,
          amountBilled: billed,
          tripNumber: params.tripNumber ?? 1,
        },
      });
    });
  }

  /** Reverse a delivery and delete it. Only the salesman who created it
   *  may undo, and only on the same calendar day. */
  async undo(id: string, salesmanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.cGDelivery.findUnique({ where: { id } });
      if (!d) throw new NotFoundException('Delivery not found');
      if (d.salesmanId !== salesmanId) {
        throw new ForbiddenException('Cannot undo someone else\'s delivery');
      }
      const sameDay = isSameDay(d.loggedAt, new Date());
      if (!sameDay) {
        throw new BadRequestException('Can only undo today\'s deliveries');
      }

      const customer = await tx.cGCustomer.findUnique({ where: { id: d.customerId } });
      if (!customer) throw new NotFoundException('Customer not found');

      await tx.cGCustomer.update({
        where: { id: customer.id },
        data: {
          emptyCansHeld:
            customer.emptyCansHeld - d.cansDelivered + d.emptyCansCollected,
          emptyGallonsHeld:
            customer.emptyGallonsHeld - d.gallonsDelivered + d.emptyGallonsCollected,
          outstandingDebt: Math.max(
            0,
            customer.outstandingDebt - d.amountBilled + d.cashCollected,
          ),
        },
      });

      await tx.cGDelivery.delete({ where: { id } });
      return d;
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
