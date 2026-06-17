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
  cashCollected?: number;
  bankCollected?: number;
  paymentReference?: string;
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

  /** Customer self-service: list collections for the calling customer's
   *  linked CG record. */
  async findForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { linkedCgCustomerId: true },
    });
    if (!user?.linkedCgCustomerId) return [];
    return this.prisma.cGCollection.findMany({
      where: { customerId: user.linkedCgCustomerId },
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Atomic: insert collection row + decrement customer's empties + reduce
   *  customer's outstanding debt by cash + bank received. */
  async record(params: RecordCollectionParams) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.cGCustomer.findUnique({
        where: { id: params.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const cash = Math.max(0, params.cashCollected ?? 0);
      const bank = Math.max(0, params.bankCollected ?? 0);
      const totalPaid = cash + bank;

      // No-penny-lost guard: reject overpayments on collection (the
      // customer can't owe less than zero).
      if (totalPaid > customer.outstandingDebt) {
        throw new BadRequestException(
          `Overpayment: collected Rs ${totalPaid} but customer only owes Rs ${customer.outstandingDebt}. Give change and re-enter the correct amount.`,
        );
      }

      await tx.cGCustomer.update({
        where: { id: customer.id },
        data: {
          emptyCansHeld: Math.max(0, customer.emptyCansHeld - params.cansCollected),
          emptyGallonsHeld: Math.max(0, customer.emptyGallonsHeld - params.gallonsCollected),
          outstandingDebt: customer.outstandingDebt - totalPaid,
          ...(totalPaid > 0 ? { lastActivityAt: new Date() } : {}),
        },
      });

      return tx.cGCollection.create({
        data: {
          customerId: customer.id,
          salesmanId: params.salesmanId,
          branchSlug: customer.branchSlug,
          cansCollected: params.cansCollected,
          gallonsCollected: params.gallonsCollected,
          cashCollected: cash,
          bankCollected: bank,
          paymentReference: params.paymentReference?.trim() || null,
          tripNumber: params.tripNumber ?? 1,
        },
      });
    });
  }

  /** Reverse a collection and delete it. Same-day, same-salesman only.
   *  Reverses both the empties and the money. */
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
          outstandingDebt: customer.outstandingDebt + c.cashCollected + c.bankCollected,
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
