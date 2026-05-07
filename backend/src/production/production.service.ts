import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProducedProduct,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RECIPE } from './recipe';

export type RecordBatchParams = {
  branchSlug: string;
  product: ProducedProduct;
  unitsProduced: number;
  batchNumber: string;
  tdsPpm?: number;
  phLevel?: number;
  wastage?: number;
  notes?: string;
  loggedById: string;
  loggedByName: string;
};

export type ListBatchesParams = {
  branchSlug?: string;
  date?: string;
};

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: ListBatchesParams = {}) {
    const where: Prisma.ProductionBatchWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (params.date) {
      const start = new Date(`${params.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException('Bad date');
      where.loggedAt = {
        gte: start,
        lt: new Date(start.getTime() + 24 * 60 * 60_000),
      };
    }
    return this.prisma.productionBatch.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
    });
  }

  /** Atomic: validate raw-material availability, deduct stock, create batch. */
  async record(params: RecordBatchParams) {
    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findUnique({ where: { slug: params.branchSlug } });
      if (!branch) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);

      const recipe = RECIPE[params.product];
      const ingredients = Object.entries(recipe);

      // Check shortfalls.
      const shortages: Array<{ id: string; need: number; have: number }> = [];
      for (const [materialId, perUnit] of ingredients) {
        const need = perUnit * params.unitsProduced;
        const m = await tx.rawMaterial.findUnique({ where: { id: materialId } });
        const have = m?.currentStock ?? 0;
        if (need > have) shortages.push({ id: materialId, need, have });
      }
      if (shortages.length > 0) {
        throw new BadRequestException({
          code: 'insufficient_raw_materials',
          shortages,
        });
      }

      // Deduct stock.
      for (const [materialId, perUnit] of ingredients) {
        await tx.rawMaterial.update({
          where: { id: materialId },
          data: { currentStock: { decrement: perUnit * params.unitsProduced } },
        });
      }

      return tx.productionBatch.create({
        data: {
          branchSlug: params.branchSlug,
          product: params.product,
          unitsProduced: params.unitsProduced,
          batchNumber: params.batchNumber.trim(),
          tdsPpm: params.tdsPpm ?? null,
          phLevel: params.phLevel ?? null,
          wastage: params.wastage ?? 0,
          notes: params.notes?.trim() || null,
          loggedById: params.loggedById,
          loggedByName: params.loggedByName,
        },
      });
    });
  }

  findById(id: string) {
    return this.prisma.productionBatch.findUnique({ where: { id } });
  }

  /** Same-day undo: restore raw-material stock, delete batch. */
  async undo(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const b = await tx.productionBatch.findUnique({ where: { id } });
      if (!b) throw new NotFoundException('Batch not found');
      if (b.loggedById !== userId) {
        throw new BadRequestException('Only the original logger can undo');
      }
      const sameDay =
        b.loggedAt.getFullYear() === new Date().getFullYear() &&
        b.loggedAt.getMonth() === new Date().getMonth() &&
        b.loggedAt.getDate() === new Date().getDate();
      if (!sameDay) {
        throw new BadRequestException("Can only undo today's batches");
      }

      const recipe = RECIPE[b.product];
      for (const [materialId, perUnit] of Object.entries(recipe)) {
        await tx.rawMaterial.update({
          where: { id: materialId },
          data: { currentStock: { increment: perUnit * b.unitsProduced } },
        });
      }

      await tx.productionBatch.delete({ where: { id } });
      return b;
    });
  }
}
