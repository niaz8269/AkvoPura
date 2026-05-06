import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const SCOPE = 'global';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get the global pricing row, creating it with defaults if missing. */
  async get() {
    const row = await this.prisma.pricing.findUnique({ where: { scope: SCOPE } });
    if (row) return row;
    return this.prisma.pricing.create({ data: { scope: SCOPE } });
  }

  async update(
    input: {
      pet600Price?: number;
      pet1500Price?: number;
      canPrice?: number;
      gallonPrice?: number;
      lostCanFee?: number;
      lostGallonFee?: number;
    },
    updatedBy: string,
  ) {
    // Ensure the row exists.
    await this.get();
    return this.prisma.pricing.update({
      where: { scope: SCOPE },
      data: {
        ...input,
        updatedBy,
      },
    });
  }
}
