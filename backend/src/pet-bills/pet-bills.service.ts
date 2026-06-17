import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type RecordBillParams = {
  customerId: string;
  salesmanId: string;
  pet600Packs: number;
  pet1500Packs: number;
  pricePet600: number;
  pricePet1500: number;
  discount?: number;
  cashCollected: number;
  bankCollected?: number;
  paymentReference?: string;
  tripNumber?: number;
};

@Injectable()
export class PetBillsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { branchSlug?: string; salesmanId?: string; date?: string } = {}) {
    let dateRange: { gte: Date; lt: Date } | undefined;
    if (params.date) {
      const start = new Date(`${params.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException('Bad date');
      dateRange = { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60_000) };
    }
    return this.prisma.petBill.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.salesmanId ? { salesmanId: params.salesmanId } : {}),
        ...(dateRange ? { loggedAt: dateRange } : {}),
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Customer self-service: list bills for the calling customer's
   *  linked Pets record (returns [] if no record is linked). */
  async findForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { linkedPetCustomerId: true },
    });
    if (!user?.linkedPetCustomerId) return [];
    return this.prisma.petBill.findMany({
      where: { customerId: user.linkedPetCustomerId },
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Atomic: insert bill row + add unpaid balance to customer debt. */
  async record(params: RecordBillParams) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.petCustomer.findUnique({
        where: { id: params.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const subtotal =
        params.pet600Packs * params.pricePet600 +
        params.pet1500Packs * params.pricePet1500;
      const discount = Math.max(0, Math.min(subtotal, params.discount ?? 0));
      const billed = subtotal - discount;
      const bankCollected = Math.max(0, params.bankCollected ?? 0);
      const totalPaid = params.cashCollected + bankCollected;

      // No-penny-lost guard: reject overpayments before they vanish into
      // Math.max(0, ...). The salesman should record only what's actually
      // owed (this bill + old debt). Surplus handed back as change is the
      // salesman's responsibility, not a database operation.
      const maxAllowedPayment = customer.outstandingDebt + billed;
      if (totalPaid > maxAllowedPayment) {
        throw new BadRequestException(
          `Overpayment: paid Rs ${totalPaid} but customer only owes Rs ${maxAllowedPayment} (Rs ${customer.outstandingDebt} old + Rs ${billed} this bill). Give change and re-enter the correct amount.`,
        );
      }

      await tx.petCustomer.update({
        where: { id: customer.id },
        data: {
          outstandingDebt: customer.outstandingDebt + billed - totalPaid,
          lastActivityAt: new Date(),
        },
      });

      return tx.petBill.create({
        data: {
          customerId: customer.id,
          salesmanId: params.salesmanId,
          branchSlug: customer.branchSlug,
          pet600Packs: params.pet600Packs,
          pet1500Packs: params.pet1500Packs,
          subtotal,
          discount,
          amountBilled: billed,
          cashCollected: params.cashCollected,
          bankCollected,
          paymentReference: params.paymentReference?.trim() || null,
          tripNumber: params.tripNumber ?? 1,
        },
      });
    });
  }

  /** Reverse + delete; same-day, same-salesman only. */
  async undo(id: string, salesmanId: string) {
    return this.prisma.$transaction(async (tx) => {
      const b = await tx.petBill.findUnique({ where: { id } });
      if (!b) throw new NotFoundException('Bill not found');
      if (b.salesmanId !== salesmanId) {
        throw new ForbiddenException("Cannot undo someone else's bill");
      }
      if (!isSameDay(b.loggedAt, new Date())) {
        throw new BadRequestException("Can only undo today's bills");
      }

      const customer = await tx.petCustomer.findUnique({ where: { id: b.customerId } });
      if (!customer) throw new NotFoundException('Customer not found');

      await tx.petCustomer.update({
        where: { id: customer.id },
        data: {
          outstandingDebt: Math.max(
            0,
            customer.outstandingDebt - b.amountBilled + b.cashCollected + b.bankCollected,
          ),
        },
      });

      await tx.petBill.delete({ where: { id } });
      return b;
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
