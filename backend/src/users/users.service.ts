import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

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
}
