import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, RawMaterialUnit } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RawMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.rawMaterial.findMany({
      orderBy: [{ id: 'asc' }],
    });
  }

  async create(input: {
    name: string;
    unit: RawMaterialUnit;
    currentStock?: number;
    reorderThreshold?: number;
    nameUr?: string;
  }) {
    const name = input.name.trim();
    // Reject duplicates so the owner doesn't accidentally create two
    // "PET Preform 600ml" rows and split their stock between them.
    const existing = await this.prisma.rawMaterial.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `A raw material named "${existing.name}" already exists.`,
      );
    }
    // The schema has no default id — pre-seed rows used human-readable
    // slugs like "preform-600". User-created rows get an auto-slug from
    // the name, with a numeric suffix to guarantee uniqueness.
    const baseSlug = slugify(name) || 'material';
    let id = baseSlug;
    let suffix = 2;
    while (await this.prisma.rawMaterial.findUnique({ where: { id } })) {
      id = `${baseSlug}-${suffix++}`;
    }
    return this.prisma.rawMaterial.create({
      data: {
        id,
        name,
        unit: input.unit,
        currentStock: Math.max(0, input.currentStock ?? 0),
        reorderThreshold: Math.max(0, input.reorderThreshold ?? 0),
        nameUr: input.nameUr?.trim() || null,
      },
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

/** ASCII slug for the RawMaterial.id column. Lowercase, alphanumerics
 *  plus hyphen; strips everything else. Used as the primary key so old
 *  seed rows like "preform-600" keep their shape. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
