import { Injectable } from '@nestjs/common';
import type { Branch, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type ListUsersParams = {
  branch?: Branch;
  role?: Role;
};

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
        ...(params.branch ? { branch: params.branch } : {}),
        ...(params.role ? { role: params.role } : {}),
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        identifier: true,
        name: true,
        role: true,
        branch: true,
        linkedCgCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
