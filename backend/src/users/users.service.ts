import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type CGRoute, type PaymentCycle, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

export type ListUsersParams = {
  branchSlug?: string;
  role?: Role;
};

export type CreateUserParams = {
  identifier: string;
  name: string;
  password: string;
  role: Role;
  branchSlug: string | null;
  linkedCgCustomerId?: string | null;
};

export type UpdateUserParams = {
  name?: string;
  role?: Role;
  branchSlug?: string | null;
  active?: boolean;
};

export type RegisterCustomerParams = {
  identifier: string;
  name: string;
  password: string;
  phone: string;
  branchSlug: string;
  customerKind: 'cg' | 'pets';
  address?: string;
};

export type VerifyCustomerParams = {
  address: string;
  cgRoute?: CGRoute;
  cgPaymentCycle?: PaymentCycle;
  pricePerCan?: number;
  pricePerGallon?: number;
  petArea?: string;
  pricePet600?: number;
  pricePet1500?: number;
};

const PUBLIC_FIELDS = {
  id: true,
  identifier: true,
  name: true,
  phone: true,
  role: true,
  branchSlug: true,
  active: true,
  verified: true,
  pendingCustomerKind: true,
  linkedCgCustomerId: true,
  linkedPetCustomerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByIdentifier(identifier: string) {
    return this.prisma.user.findUnique({
      where: { identifier: identifier.trim().toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * List users with optional filters. Excludes the password hash.
   * Caller is expected to apply role-based access scoping (see controller).
   */
  list(params: ListUsersParams = {}) {
    return this.prisma.user.findMany({
      where: {
        ...(params.branchSlug ? { branchSlug: params.branchSlug } : {}),
        ...(params.role ? { role: params.role } : {}),
      },
      orderBy: [{ active: 'desc' }, { role: 'asc' }, { name: 'asc' }],
      select: PUBLIC_FIELDS,
    });
  }

  private async assertBranchExists(slug: string | null | undefined) {
    if (!slug) return;
    const exists = await this.prisma.branch.findUnique({ where: { slug } });
    if (!exists) throw new BadRequestException(`Unknown branch: ${slug}`);
  }

  async create(params: CreateUserParams) {
    const identifier = params.identifier.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { identifier } });
    if (existing) {
      throw new ConflictException(`Identifier "${identifier}" already exists`);
    }
    await this.assertBranchExists(params.branchSlug);
    const passwordHash = await bcrypt.hash(params.password, 10);
    return this.prisma.user.create({
      data: {
        identifier,
        name: params.name.trim(),
        passwordHash,
        role: params.role,
        branchSlug: params.branchSlug,
        linkedCgCustomerId: params.linkedCgCustomerId ?? null,
      },
      select: PUBLIC_FIELDS,
    });
  }

  async update(id: string, params: UpdateUserParams) {
    if (params.branchSlug !== undefined) {
      await this.assertBranchExists(params.branchSlug);
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(params.name !== undefined ? { name: params.name.trim() } : {}),
        ...(params.role !== undefined ? { role: params.role } : {}),
        ...(params.branchSlug !== undefined ? { branchSlug: params.branchSlug } : {}),
        ...(params.active !== undefined ? { active: params.active } : {}),
      },
      select: PUBLIC_FIELDS,
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { ok: true };
  }

  /**
   * Customer self-registration. Creates a User with role=customer,
   * verified=false. Does NOT create the linked CGCustomer/PetCustomer
   * record yet — that happens at verify() time so the manager can fill
   * in operational details (route, payment cycle, area, prices).
   */
  async registerCustomer(params: RegisterCustomerParams) {
    const identifier = params.identifier.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { identifier } });
    if (existing) {
      throw new ConflictException(`Identifier "${identifier}" already exists`);
    }
    await this.assertBranchExists(params.branchSlug);
    const passwordHash = await bcrypt.hash(params.password, 10);
    return this.prisma.user.create({
      data: {
        identifier,
        name: params.name.trim(),
        passwordHash,
        phone: params.phone.trim(),
        role: Role.customer,
        branchSlug: params.branchSlug,
        verified: false,
        pendingCustomerKind: params.customerKind,
      },
      select: PUBLIC_FIELDS,
    });
  }

  /**
   * List all unverified customer registrations awaiting approval. Manager
   * call site passes branchSlug to scope to their own branch.
   */
  listPending(branchSlug: string) {
    return this.prisma.user.findMany({
      where: {
        role: Role.customer,
        verified: false,
        branchSlug,
      },
      orderBy: [{ createdAt: 'asc' }],
      select: PUBLIC_FIELDS,
    });
  }

  /**
   * Approve a pending customer: create the linked customer record (CG or
   * Pets depending on what they chose during registration) and flip the
   * user's verified flag so they can log in. All operations in a single
   * transaction so the user can't end up verified with no linked record.
   */
  async verifyCustomer(userId: string, params: VerifyCustomerParams) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.customer) {
      throw new BadRequestException('Only customer accounts can be verified');
    }
    if (user.verified) {
      throw new BadRequestException('This customer is already verified');
    }
    if (!user.branchSlug) {
      throw new BadRequestException('Customer has no branch assigned');
    }
    if (!user.pendingCustomerKind) {
      throw new BadRequestException('Customer kind missing from registration');
    }

    if (user.pendingCustomerKind === 'cg') {
      if (!params.cgRoute) throw new BadRequestException('cgRoute is required for CG customers');
      if (!params.cgPaymentCycle) {
        throw new BadRequestException('cgPaymentCycle is required for CG customers');
      }
    } else if (user.pendingCustomerKind === 'pets') {
      if (!params.petArea) throw new BadRequestException('petArea is required for Pets customers');
    } else {
      throw new BadRequestException(`Unknown customer kind: ${user.pendingCustomerKind}`);
    }

    // CG customers need a price for cans + gallons. If manager doesn't
    // provide one, fall back to global defaults so the row can be created.
    const globalPricing = await this.prisma.pricing.findUnique({
      where: { scope: 'global' },
    });
    const defaultCanPrice = globalPricing?.canPrice ?? 280;
    const defaultGallonPrice = globalPricing?.gallonPrice ?? 200;

    return this.prisma.$transaction(async (tx) => {
      let linkedCgCustomerId: string | null = null;
      let linkedPetCustomerId: string | null = null;

      if (user.pendingCustomerKind === 'cg') {
        const cg = await tx.cGCustomer.create({
          data: {
            name: user.name,
            phone: user.phone ?? '',
            address: params.address,
            branchSlug: user.branchSlug!,
            route: params.cgRoute!,
            paymentCycle: params.cgPaymentCycle!,
            pricePerCan: params.pricePerCan ?? defaultCanPrice,
            pricePerGallon: params.pricePerGallon ?? defaultGallonPrice,
          },
        });
        linkedCgCustomerId = cg.id;
      } else {
        const pet = await tx.petCustomer.create({
          data: {
            name: user.name,
            phone: user.phone ?? '',
            address: params.address,
            area: params.petArea!,
            branchSlug: user.branchSlug!,
            ...(params.pricePet600 !== undefined ? { pricePet600: params.pricePet600 } : {}),
            ...(params.pricePet1500 !== undefined ? { pricePet1500: params.pricePet1500 } : {}),
          },
        });
        linkedPetCustomerId = pet.id;
      }

      return tx.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          pendingCustomerKind: null,
          linkedCgCustomerId,
          linkedPetCustomerId,
        },
        select: PUBLIC_FIELDS,
      });
    });
  }
}
