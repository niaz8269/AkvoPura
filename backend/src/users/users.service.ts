import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { Role } from '@prisma/client';
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

const PUBLIC_FIELDS = {
  id: true,
  identifier: true,
  name: true,
  role: true,
  branchSlug: true,
  active: true,
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
}
