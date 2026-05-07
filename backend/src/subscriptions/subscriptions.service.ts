import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CustomerOrderStatus,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type SubscriptionItem = {
  productId: 'cans' | 'gallons' | 'pet600' | 'pet1500';
  qty: number;
  unitPrice: number;
};

export type CreateSubscriptionParams = {
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  items: SubscriptionItem[];
  daysOfWeek: number[];
  preferredTime?: string;
  notes?: string;
};

export type UpdateSubscriptionData = {
  items?: SubscriptionItem[];
  daysOfWeek?: number[];
  preferredTime?: string;
  notes?: string;
  active?: boolean;
};

export type ListSubscriptionsParams = {
  branchSlug?: string;
  customerUserId?: string;
  active?: boolean;
};

/** yyyy-mm-dd in the server's local timezone — used as a deduplication
 *  key in Subscription.lastGeneratedOn. */
function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(params: ListSubscriptionsParams = {}) {
    const where: Prisma.SubscriptionWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (params.customerUserId) where.customerUserId = params.customerUserId;
    if (params.active !== undefined) where.active = params.active;
    return this.prisma.subscription.findMany({
      where,
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.subscription.findUnique({ where: { id } });
  }

  async create(params: CreateSubscriptionParams) {
    const branch = await this.prisma.branch.findUnique({
      where: { slug: params.branchSlug },
    });
    if (!branch) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);

    // Dedupe + sort daysOfWeek for predictable storage.
    const days = Array.from(new Set(params.daysOfWeek)).sort();

    return this.prisma.subscription.create({
      data: {
        branchSlug: params.branchSlug,
        customerUserId: params.customerUserId,
        customerName: params.customerName,
        items: params.items as unknown as Prisma.JsonArray,
        daysOfWeek: days,
        preferredTime: params.preferredTime?.trim() || null,
        notes: params.notes?.trim() || null,
        active: true,
      },
    });
  }

  async update(id: string, data: UpdateSubscriptionData) {
    const target = await this.prisma.subscription.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Subscription not found');

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(data.items !== undefined
          ? { items: data.items as unknown as Prisma.JsonArray }
          : {}),
        ...(data.daysOfWeek !== undefined
          ? {
              daysOfWeek: Array.from(new Set(data.daysOfWeek)).sort(),
            }
          : {}),
        ...(data.preferredTime !== undefined
          ? { preferredTime: data.preferredTime.trim() || null }
          : {}),
        ...(data.notes !== undefined
          ? { notes: data.notes.trim() || null }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
  }

  async remove(id: string) {
    const target = await this.prisma.subscription.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Subscription not found');
    await this.prisma.subscription.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Find every active subscription whose daysOfWeek matches today and that
   * hasn't been generated yet today, then create one pending order each.
   *
   * Idempotent — safe to call multiple times the same day; a guard on
   * lastGeneratedOn prevents duplicates if the cron fires twice or if the
   * server restarts.
   *
   * Returns the list of generated order IDs (mostly useful for
   * tests / a manual trigger endpoint later).
   */
  async generateDueToday(now = new Date()): Promise<string[]> {
    const dow = now.getDay(); // 0..6
    const dayKey = todayKey(now);

    // Postgres int[] "has" filter — Prisma supports this on Postgres only.
    const due = await this.prisma.subscription.findMany({
      where: {
        active: true,
        daysOfWeek: { has: dow },
        OR: [
          { lastGeneratedOn: null },
          { lastGeneratedOn: { not: dayKey } },
        ],
      },
    });

    const created: string[] = [];

    for (const sub of due) {
      const items = sub.items as unknown as SubscriptionItem[];
      if (!Array.isArray(items) || items.length === 0) {
        this.logger.warn(`Subscription ${sub.id} has no items, skipping`);
        continue;
      }
      const totalAmount = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);

      try {
        // Atomically: create the order + mark sub as generated for today.
        // If anything fails the sub stays unmarked so the next cron retries.
        const result = await this.prisma.$transaction(async (tx) => {
          const order = await tx.customerOrder.create({
            data: {
              branchSlug: sub.branchSlug,
              customerUserId: sub.customerUserId,
              customerName: sub.customerName,
              items: sub.items as unknown as Prisma.JsonArray,
              totalAmount,
              preferredTime: sub.preferredTime,
              // ManagerOrdersScreen looks for "From subscription" in notes
              // to badge the card.
              notes: sub.notes
                ? `From subscription · ${sub.notes}`
                : `From subscription #${sub.id.slice(-6)}`,
              status: CustomerOrderStatus.pending,
            },
          });
          await tx.subscription.update({
            where: { id: sub.id },
            data: { lastGeneratedOn: dayKey },
          });
          return order;
        });
        created.push(result.id);
      } catch (e) {
        this.logger.error(
          `Failed to generate order for subscription ${sub.id}`,
          e as Error,
        );
      }
    }

    if (created.length > 0) {
      this.logger.log(
        `Subscription cron generated ${created.length} order(s) for ${dayKey}`,
      );
    }
    return created;
  }

  /**
   * Daily cron at 06:00 server local time. Generates orders for every
   * active subscription whose daysOfWeek matches today.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async dailyCron(): Promise<void> {
    try {
      await this.generateDueToday();
    } catch (e) {
      this.logger.error('Subscription daily cron failed', e as Error);
    }
  }
}
