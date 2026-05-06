import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.branch.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  findBySlug(slug: string) {
    return this.prisma.branch.findUnique({ where: { slug } });
  }

  async create(input: {
    slug: string;
    name: string;
    nameUr?: string | null;
    location?: string | null;
  }) {
    const slug = input.slug.trim().toLowerCase();
    const existing = await this.prisma.branch.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Branch slug "${slug}" already exists`);
    }
    return this.prisma.branch.create({
      data: {
        slug,
        name: input.name.trim(),
        nameUr: input.nameUr?.trim() || null,
        location: input.location?.trim() || null,
      },
    });
  }

  update(
    slug: string,
    input: {
      name?: string;
      nameUr?: string | null;
      location?: string | null;
      active?: boolean;
    },
  ) {
    return this.prisma.branch.update({
      where: { slug },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.nameUr !== undefined ? { nameUr: input.nameUr } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
  }
}
