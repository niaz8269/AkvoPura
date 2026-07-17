import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseCategory,
  ExpenseStatus,
  Role,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TripsService } from '../trips/trips.service';

export type SubmitExpenseParams = {
  branchSlug: string;
  submittedById: string;
  submittedByName: string;
  submittedByRole: Role;
  category: ExpenseCategory;
  amount: number;
  notes?: string;
};

export type ListExpensesParams = {
  branchSlug?: string;
  status?: ExpenseStatus;
};

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trips: TripsService,
  ) {}

  list(params: ListExpensesParams = {}) {
    const where: Prisma.ExpenseWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (params.status) where.status = params.status;
    return this.prisma.expense.findMany({
      where,
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
    });
  }

  /** All expenses submitted by the given user, newest first. */
  listMine(submittedById: string) {
    return this.prisma.expense.findMany({
      where: { submittedById },
      orderBy: { submittedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  async submit(params: SubmitExpenseParams) {
    const branchExists = await this.prisma.branch.findUnique({
      where: { slug: params.branchSlug },
    });
    if (!branchExists) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);
    // If a salesman is submitting during an active trip, auto-link so the
    // manager can see per-trip fuel/food/etc. Managers and owners have no
    // active trip → tripId stays null.
    const activeTrip = await this.trips.activeForSalesman(params.submittedById);
    return this.prisma.expense.create({
      data: {
        branchSlug: params.branchSlug,
        submittedById: params.submittedById,
        submittedByName: params.submittedByName,
        submittedByRole: params.submittedByRole,
        category: params.category,
        amount: params.amount,
        notes: params.notes?.trim() || null,
        status: ExpenseStatus.pending,
        tripId: activeTrip?.id ?? null,
      },
    });
  }

  async decide(
    id: string,
    decision: ExpenseStatus,
    deciderId: string,
    note?: string,
  ) {
    const e = await this.prisma.expense.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Expense not found');
    if (e.status === ExpenseStatus.approved || e.status === ExpenseStatus.rejected) {
      throw new ForbiddenException(
        `Expense is already ${e.status} — cannot change decision`,
      );
    }
    return this.prisma.expense.update({
      where: { id },
      data: {
        status: decision,
        decisionNote: note?.trim() || null,
        decidedById: deciderId,
        decidedAt: new Date(),
      },
    });
  }
}
