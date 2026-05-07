import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpenseStatus, Role } from '@prisma/client';
import type { Request } from 'express';

import { ExpensesService } from './expenses.service';
import { SubmitExpenseDto } from './dto/submit-expense.dto';
import { DecideExpenseDto } from './dto/decide-expense.dto';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../auth/jwt.strategy';

const SUBMITTER_ROLES = new Set<string>([
  Role.owner,
  Role.manager,
  Role.pets_salesman,
  Role.cans_gallons_salesman,
]);

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly users: UsersService,
  ) {}

  /** Owner: anywhere. Manager / salesman: own branch only. */
  private resolveScope(me: JwtPayload, branchQ?: string) {
    if (me.role === 'owner') return branchQ;
    if (!me.branch) throw new ForbiddenException('No branch assigned');
    if (branchQ && branchQ !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return me.branch;
  }

  /** Caller's own submitted expenses across all statuses. */
  @Get('mine')
  listMine(@Req() req: Request) {
    const me = req.user as JwtPayload;
    return this.expenses.listMine(me.sub);
  }

  @Get()
  list(
    @Req() req: Request,
    @Query('branchSlug') branchSlug?: string,
    @Query('status') statusQ?: string,
  ) {
    const me = req.user as JwtPayload;
    let status: ExpenseStatus | undefined;
    if (statusQ) {
      if (!Object.values(ExpenseStatus).includes(statusQ as ExpenseStatus)) {
        throw new BadRequestException(`Unknown status: ${statusQ}`);
      }
      status = statusQ as ExpenseStatus;
    }
    return this.expenses.list({
      branchSlug: this.resolveScope(me, branchSlug),
      status,
    });
  }

  @Post()
  async submit(@Req() req: Request, @Body() dto: SubmitExpenseDto) {
    const me = req.user as JwtPayload;
    if (!SUBMITTER_ROLES.has(me.role)) {
      throw new ForbiddenException('Insufficient privileges');
    }

    // Determine which branch this expense belongs to.
    let branchSlug = dto.branchSlug;
    if (!branchSlug) {
      if (me.role === 'owner') {
        throw new BadRequestException(
          'Owner must explicitly specify branchSlug',
        );
      }
      branchSlug = me.branch ?? undefined;
      if (!branchSlug) throw new ForbiddenException('No branch assigned');
    } else {
      this.resolveScope(me, branchSlug);
    }

    // Look up the submitter's display name.
    const submitter = await this.users.findById(me.sub);
    if (!submitter) throw new ForbiddenException('Submitter not found');

    return this.expenses.submit({
      branchSlug,
      submittedById: me.sub,
      submittedByName: submitter.name,
      submittedByRole: submitter.role,
      category: dto.category,
      amount: dto.amount,
      notes: dto.notes,
    });
  }

  @Patch(':id/decide')
  async decide(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: DecideExpenseDto,
  ) {
    const me = req.user as JwtPayload;
    const target = await this.expenses.findById(id);
    if (!target) throw new NotFoundException('Expense not found');

    // Permission rules:
    //  - Manager can decide on pending expenses in their own branch.
    //  - Owner can decide on anything (including forwarded).
    //  - 'forwarded' is reserved for managers (they can't approve large
    //    expenses themselves — must escalate to owner).
    if (me.role === 'owner') {
      // anywhere; any decision allowed
    } else if (me.role === 'manager') {
      if (!me.branch || target.branchSlug !== me.branch) {
        throw new ForbiddenException('Manager can only decide on own-branch expenses');
      }
      if (target.status !== ExpenseStatus.pending) {
        throw new ForbiddenException('Only pending expenses can be decided by the manager');
      }
    } else {
      throw new ForbiddenException('Insufficient privileges');
    }

    return this.expenses.decide(id, dto.decision, me.sub, dto.decisionNote);
  }
}
