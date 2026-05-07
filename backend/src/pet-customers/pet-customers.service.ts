import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type ListPetCustomersParams = {
  branchSlug?: string;
  includeInactive?: boolean;
};

@Injectable()
export class PetCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: ListPetCustomersParams = {}) {
    const where: Prisma.PetCustomerWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (!params.includeInactive) where.active = true;
    return this.prisma.petCustomer.findMany({
      where,
      orderBy: [{ active: 'desc' }, { area: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.petCustomer.findUnique({ where: { id } });
  }

  /** Resolve the linked Pets customer record for a customer-role user.
   *  Returns null if the user has no linked Pets record yet. */
  async findForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { linkedPetCustomerId: true },
    });
    if (!user?.linkedPetCustomerId) return null;
    return this.prisma.petCustomer.findUnique({
      where: { id: user.linkedPetCustomerId },
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
    area: string;
    branchSlug: string;
    pricePet600?: number | null;
    pricePet1500?: number | null;
    notes?: string;
  }) {
    await this.assertBranchExists(input.branchSlug);
    return this.prisma.petCustomer.create({
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        area: input.area.trim(),
        branchSlug: input.branchSlug,
        pricePet600: input.pricePet600 ?? null,
        pricePet1500: input.pricePet1500 ?? null,
        notes: input.notes?.trim() || null,
      },
    });
  }

  async update(id: string, input: Prisma.PetCustomerUpdateInput) {
    const existing = await this.prisma.petCustomer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');
    return this.prisma.petCustomer.update({ where: { id }, data: input });
  }
}
