import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RawMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.rawMaterial.findMany({
      orderBy: [{ id: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.rawMaterial.findUnique({ where: { id } });
  }

  async receive(id: string, units: number) {
    const m = await this.prisma.rawMaterial.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Raw material not found');
    return this.prisma.rawMaterial.update({
      where: { id },
      data: { currentStock: m.currentStock + units },
    });
  }

  async update(id: string, input: Prisma.RawMaterialUpdateInput) {
    const m = await this.prisma.rawMaterial.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Raw material not found');
    return this.prisma.rawMaterial.update({ where: { id }, data: input });
  }
}
