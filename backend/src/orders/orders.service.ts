import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerOrderStatus,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type OrderItem = {
  productId: 'cans' | 'gallons' | 'pet600' | 'pet1500';
  qty: number;
  unitPrice: number;
};

export type PlaceOrderParams = {
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  items: OrderItem[];
  preferredTime?: string;
  notes?: string;
};

export type ListOrdersParams = {
  branchSlug?: string;
  customerUserId?: string;
  assignedSalesmanId?: string;
  status?: CustomerOrderStatus;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: ListOrdersParams = {}) {
    const where: Prisma.CustomerOrderWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (params.customerUserId) where.customerUserId = params.customerUserId;
    if (params.assignedSalesmanId) where.assignedSalesmanId = params.assignedSalesmanId;
    if (params.status) where.status = params.status;
    return this.prisma.customerOrder.findMany({
      where,
      orderBy: [{ status: 'asc' }, { placedAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.customerOrder.findUnique({ where: { id } });
  }

  async place(params: PlaceOrderParams) {
    const branch = await this.prisma.branch.findUnique({
      where: { slug: params.branchSlug },
    });
    if (!branch) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);
    const totalAmount = params.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    return this.prisma.customerOrder.create({
      data: {
        branchSlug: params.branchSlug,
        customerUserId: params.customerUserId,
        customerName: params.customerName,
        items: params.items as unknown as Prisma.JsonArray,
        totalAmount,
        preferredTime: params.preferredTime?.trim() || null,
        notes: params.notes?.trim() || null,
        status: CustomerOrderStatus.pending,
      },
    });
  }

  async update(
    id: string,
    updaterId: string,
    data: {
      status?: CustomerOrderStatus;
      assignedSalesmanId?: string;
      assignedSalesmanName?: string;
      managerNote?: string;
    },
  ) {
    const target = await this.prisma.customerOrder.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Order not found');
    return this.prisma.customerOrder.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.assignedSalesmanId !== undefined
          ? { assignedSalesmanId: data.assignedSalesmanId }
          : {}),
        ...(data.assignedSalesmanName !== undefined
          ? { assignedSalesmanName: data.assignedSalesmanName }
          : {}),
        ...(data.managerNote !== undefined ? { managerNote: data.managerNote } : {}),
        updatedById: updaterId,
      },
    });
  }

  /**
   * Fulfill an order: convert it into actual delivery / bill records and
   * mark it delivered. Atomic transaction so customer debt + inventory +
   * order status stay consistent.
   *
   * Auto-creates a CG / Pets customer record for this user if missing
   * (using sane defaults; manager can refine later).
   */
  async fulfill(
    orderId: string,
    salesmanId: string,
    payload: {
      cashCollected?: number;
      bankCollected?: number;
      paymentReference?: string;
      emptyCansCollected?: number;
      emptyGallonsCollected?: number;
      discount?: number;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === 'delivered' || order.status === 'cancelled') {
        throw new BadRequestException(
          `Order is already ${order.status} — cannot fulfill`,
        );
      }

      const customerUser = await tx.user.findUnique({
        where: { id: order.customerUserId },
      });
      if (!customerUser) {
        throw new NotFoundException('Customer user not found');
      }

      const items = order.items as unknown as Array<{
        productId: 'cans' | 'gallons' | 'pet600' | 'pet1500';
        qty: number;
        unitPrice: number;
      }>;

      const cans = items.find((it) => it.productId === 'cans')?.qty ?? 0;
      const gallons = items.find((it) => it.productId === 'gallons')?.qty ?? 0;
      const pet600 = items.find((it) => it.productId === 'pet600')?.qty ?? 0;
      const pet1500 = items.find((it) => it.productId === 'pet1500')?.qty ?? 0;
      const hasCG = cans + gallons > 0;
      const hasPets = pet600 + pet1500 > 0;

      // Allocate cash + bank between CG + Pets in proportion to value.
      const total = order.totalAmount || 1;
      const cgValue = items
        .filter((it) => it.productId === 'cans' || it.productId === 'gallons')
        .reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const cashTotal = Math.max(0, payload.cashCollected ?? 0);
      const bankTotal = Math.max(0, payload.bankCollected ?? 0);
      const cgCash = hasCG && hasPets
        ? Math.round((cashTotal * cgValue) / total)
        : hasCG ? cashTotal : 0;
      const cgBank = hasCG && hasPets
        ? Math.round((bankTotal * cgValue) / total)
        : hasCG ? bankTotal : 0;
      const petCash = cashTotal - cgCash;
      const petBank = bankTotal - cgBank;

      // ---- CG side ----
      let cgCustomerId = customerUser.linkedCgCustomerId;
      if (hasCG) {
        if (!cgCustomerId) {
          const canPrice =
            items.find((it) => it.productId === 'cans')?.unitPrice ?? 250;
          const gallonPrice =
            items.find((it) => it.productId === 'gallons')?.unitPrice ?? 200;
          const created = await tx.cGCustomer.create({
            data: {
              name: customerUser.name,
              phone: '',
              address: order.preferredTime
                ? `Address on file (${order.preferredTime})`
                : 'Address on file',
              branchSlug: order.branchSlug,
              route: 'others',
              paymentCycle: 'weekly',
              usualCans: cans,
              usualGallons: gallons,
              pricePerCan: canPrice,
              pricePerGallon: gallonPrice,
            },
          });
          cgCustomerId = created.id;
          await tx.user.update({
            where: { id: customerUser.id },
            data: { linkedCgCustomerId: created.id },
          });
        }

        const cgCustomer = await tx.cGCustomer.findUnique({
          where: { id: cgCustomerId },
        });
        if (!cgCustomer) throw new NotFoundException('CG customer missing');

        const billed =
          cans * cgCustomer.pricePerCan + gallons * cgCustomer.pricePerGallon;
        const cgPaid = cgCash + cgBank;
        const emptyCans = payload.emptyCansCollected ?? 0;
        const emptyGallons = payload.emptyGallonsCollected ?? 0;

        await tx.cGCustomer.update({
          where: { id: cgCustomer.id },
          data: {
            emptyCansHeld:
              cgCustomer.emptyCansHeld + cans - emptyCans,
            emptyGallonsHeld:
              cgCustomer.emptyGallonsHeld + gallons - emptyGallons,
            outstandingDebt: Math.max(
              0,
              cgCustomer.outstandingDebt + billed - cgPaid,
            ),
            lastActivityAt: new Date(),
          },
        });

        await tx.cGDelivery.create({
          data: {
            customerId: cgCustomer.id,
            salesmanId,
            branchSlug: cgCustomer.branchSlug,
            cansDelivered: cans,
            gallonsDelivered: gallons,
            emptyCansCollected: emptyCans,
            emptyGallonsCollected: emptyGallons,
            cashCollected: cgCash,
            bankCollected: cgBank,
            paymentReference: payload.paymentReference?.trim() || null,
            amountBilled: billed,
            tripNumber: 1,
          },
        });
      }

      // ---- Pets side ----
      let petCustomerId = customerUser.linkedPetCustomerId;
      if (hasPets) {
        if (!petCustomerId) {
          const created = await tx.petCustomer.create({
            data: {
              name: customerUser.name,
              phone: '',
              address: order.preferredTime
                ? `Address on file (${order.preferredTime})`
                : 'Address on file',
              area: 'Order delivery',
              branchSlug: order.branchSlug,
            },
          });
          petCustomerId = created.id;
          await tx.user.update({
            where: { id: customerUser.id },
            data: { linkedPetCustomerId: created.id },
          });
        }

        const petCustomer = await tx.petCustomer.findUnique({ where: { id: petCustomerId } });
        if (!petCustomer) throw new NotFoundException('Pets customer missing');

        const unit600 =
          items.find((it) => it.productId === 'pet600')?.unitPrice ?? 280;
        const unit1500 =
          items.find((it) => it.productId === 'pet1500')?.unitPrice ?? 320;
        const subtotal = pet600 * unit600 + pet1500 * unit1500;
        const discount = Math.max(0, Math.min(subtotal, payload.discount ?? 0));
        const billed = subtotal - discount;
        const petPaid = petCash + petBank;

        await tx.petCustomer.update({
          where: { id: petCustomer.id },
          data: {
            outstandingDebt: Math.max(
              0,
              petCustomer.outstandingDebt + billed - petPaid,
            ),
            lastActivityAt: new Date(),
          },
        });

        await tx.petBill.create({
          data: {
            customerId: petCustomer.id,
            salesmanId,
            branchSlug: petCustomer.branchSlug,
            pet600Packs: pet600,
            pet1500Packs: pet1500,
            subtotal,
            discount,
            amountBilled: billed,
            cashCollected: petCash,
            bankCollected: petBank,
            paymentReference: payload.paymentReference?.trim() || null,
            tripNumber: 1,
          },
        });
      }

      // Mark order delivered.
      return tx.customerOrder.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          updatedById: salesmanId,
        },
      });
    });
  }
}
