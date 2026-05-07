import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CGRoute, PaymentCycle, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type ListParams = {
  branchSlug?: string;
  includeInactive?: boolean;
};

@Injectable()
export class CGCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: ListParams = {}) {
    const where: Prisma.CGCustomerWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (!params.includeInactive) where.active = true;
    return this.prisma.cGCustomer.findMany({
      where,
      orderBy: [{ active: 'desc' }, { route: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.cGCustomer.findUnique({ where: { id } });
  }

  /** Resolve the linked CG customer record for a customer-role user.
   *  Returns null if the user has no linked CG record yet (i.e., no CG
   *  order has ever been fulfilled for them). */
  async findForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { linkedCgCustomerId: true },
    });
    if (!user?.linkedCgCustomerId) return null;
    return this.prisma.cGCustomer.findUnique({
      where: { id: user.linkedCgCustomerId },
    });
  }

  private async assertBranchExists(slug: string) {
    const exists = await this.prisma.branch.findUnique({ where: { slug } });
    if (!exists) throw new BadRequestException(`Unknown branch: ${slug}`);
  }

  async create(input: {
    name: string;
    phone: string;
    address: string;
    branchSlug: string;
    route: CGRoute;
    paymentCycle: PaymentCycle;
    pricePerCan: number;
    pricePerGallon: number;
    usualCans?: number;
    usualGallons?: number;
    notes?: string;
  }) {
    await this.assertBranchExists(input.branchSlug);
    return this.prisma.cGCustomer.create({
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        branchSlug: input.branchSlug,
        route: input.route,
        paymentCycle: input.paymentCycle,
        pricePerCan: input.pricePerCan,
        pricePerGallon: input.pricePerGallon,
        usualCans: input.usualCans ?? 0,
        usualGallons: input.usualGallons ?? 0,
        notes: input.notes?.trim() || null,
      },
    });
  }

  async update(
    id: string,
    input: Prisma.CGCustomerUpdateInput,
  ) {
    const existing = await this.prisma.cGCustomer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');
    return this.prisma.cGCustomer.update({ where: { id }, data: input });
  }

  /** Charge a customer for lost / damaged containers. Removes the
   *  empties and adds the charge to outstanding debt. */
  async chargeLoss(
    id: string,
    cans: number,
    gallons: number,
    totalCharge: number,
  ) {
    const c = await this.prisma.cGCustomer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return this.prisma.cGCustomer.update({
      where: { id },
      data: {
        emptyCansHeld: Math.max(0, c.emptyCansHeld - cans),
        emptyGallonsHeld: Math.max(0, c.emptyGallonsHeld - gallons),
        outstandingDebt: c.outstandingDebt + Math.max(0, totalCharge),
      },
    });
  }
}
