import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type RecordReturnParams = {
  customerId: string;
  salesmanId: string;
  pet600Packs: number;
  pet1500Packs: number;
  pricePet600: number;
  pricePet1500: number;
  reason?: string;
  tripNumber?: number;
};

@Injectable()
export class PetReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { branchSlug?: string; salesmanId?: string; date?: string } = {}) {
    let dateRange: { gte: Date; lt: Date } | undefined;
    if (params.date) {
      const start = new Date(`${params.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException('Bad date');
      dateRange = { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60_000) };
    }
    return this.prisma.petReturn.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.salesmanId ? { salesmanId: params.salesmanId } : {}),
        ...(dateRange ? { loggedAt: dateRange } : {}),
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Atomic: insert return row + credit refund against customer debt. */
  async record(params: RecordReturnParams) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.petCustomer.findUnique({
        where: { id: params.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const refund =
        params.pet600Packs * params.pricePet600 +
        params.pet1500Packs * params.pricePet1500;

      await tx.petCustomer.update({
        where: { id: customer.id },
        data: {
          outstandingDebt: Math.max(0, customer.outstandingDebt - refund),
        },
      });

      return tx.petReturn.create({
        data: {
          customerId: customer.id,
          salesmanId: params.salesmanId,
          branchSlug: customer.branchSlug,
          pet600Packs: params.pet600Packs,
          pet1500Packs: params.pet1500Packs,
          refundAmount: refund,
          reason: params.reason?.trim() || null,
          tripNumber: params.tripNumber ?? 1,
        },
      });
    });
  }

  /** Reverse + delete; same-day, same-salesman only. */
  async undo(id: string, salesmanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.petReturn.findUnique({ where: { id } });
      if (!r) throw new NotFoundException('Return not found');
      if (r.salesmanId !== salesmanId) {
        throw new ForbiddenException("Cannot undo someone else's return");
      }
      if (!isSameDay(r.loggedAt, new Date())) {
        throw new BadRequestException("Can only undo today's returns");
      }

      const customer = await tx.petCustomer.findUnique({ where: { id: r.customerId } });
      if (!customer) throw new NotFoundException('Customer not found');

      await tx.petCustomer.update({
        where: { id: customer.id },
        data: {
          outstandingDebt: customer.outstandingDebt + r.refundAmount,
        },
      });

      await tx.petReturn.delete({ where: { id } });
      return r;
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
