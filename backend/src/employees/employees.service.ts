import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmploymentType,
  type Prisma,
  Role,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type CreateEmployeeParams = {
  name: string;
  phone: string;
  role: Role;
  branchSlug: string;
  employmentType: EmploymentType;
  monthlySalary?: number;
  hourlyRate?: number;
  notes?: string;
  linkedUserId?: string;
};

export type UpdateEmployeeParams = {
  name?: string;
  phone?: string;
  role?: Role;
  employmentType?: EmploymentType;
  monthlySalary?: number;
  hourlyRate?: number;
  active?: boolean;
  notes?: string;
  linkedUserId?: string;
};

export type ListEmployeesParams = {
  branchSlug?: string;
  includeInactive?: boolean;
};

/** Today as yyyy-mm-dd in server local time. */
function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  // -------- Employees CRUD --------

  list(params: ListEmployeesParams = {}) {
    const where: Prisma.EmployeeWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (!params.includeInactive) where.active = true;
    return this.prisma.employee.findMany({
      where,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  async create(params: CreateEmployeeParams) {
    const branch = await this.prisma.branch.findUnique({
      where: { slug: params.branchSlug },
    });
    if (!branch) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);

    // Salaried needs monthlySalary; hourly needs hourlyRate.
    if (params.employmentType === EmploymentType.salaried && !params.monthlySalary) {
      throw new BadRequestException('Salaried employees need monthlySalary');
    }
    if (params.employmentType === EmploymentType.hourly && !params.hourlyRate) {
      throw new BadRequestException('Hourly employees need hourlyRate');
    }

    if (params.linkedUserId) {
      const u = await this.prisma.user.findUnique({
        where: { id: params.linkedUserId },
      });
      if (!u) throw new BadRequestException('linkedUserId not found');
      const existingLink = await this.prisma.employee.findUnique({
        where: { linkedUserId: params.linkedUserId },
      });
      if (existingLink) {
        throw new BadRequestException('That user is already linked to another employee');
      }
    }

    return this.prisma.employee.create({
      data: {
        name: params.name.trim(),
        phone: params.phone.trim(),
        role: params.role,
        branchSlug: params.branchSlug,
        employmentType: params.employmentType,
        monthlySalary:
          params.employmentType === EmploymentType.salaried
            ? params.monthlySalary ?? null
            : null,
        hourlyRate:
          params.employmentType === EmploymentType.hourly
            ? params.hourlyRate ?? null
            : null,
        notes: params.notes?.trim() || null,
        linkedUserId: params.linkedUserId ?? null,
      },
    });
  }

  async update(id: string, params: UpdateEmployeeParams) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    // If switching employment type, null the now-irrelevant pay field.
    const finalType = params.employmentType ?? existing.employmentType;
    const monthlySalary =
      finalType === EmploymentType.salaried
        ? params.monthlySalary ?? existing.monthlySalary
        : null;
    const hourlyRate =
      finalType === EmploymentType.hourly
        ? params.hourlyRate ?? existing.hourlyRate
        : null;

    if (params.linkedUserId && params.linkedUserId !== existing.linkedUserId) {
      const u = await this.prisma.user.findUnique({
        where: { id: params.linkedUserId },
      });
      if (!u) throw new BadRequestException('linkedUserId not found');
      const existingLink = await this.prisma.employee.findUnique({
        where: { linkedUserId: params.linkedUserId },
      });
      if (existingLink && existingLink.id !== id) {
        throw new BadRequestException('That user is already linked to another employee');
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(params.name !== undefined ? { name: params.name.trim() } : {}),
        ...(params.phone !== undefined ? { phone: params.phone.trim() } : {}),
        ...(params.role !== undefined ? { role: params.role } : {}),
        ...(params.employmentType !== undefined
          ? { employmentType: params.employmentType }
          : {}),
        monthlySalary,
        hourlyRate,
        ...(params.active !== undefined ? { active: params.active } : {}),
        ...(params.notes !== undefined
          ? { notes: params.notes.trim() || null }
          : {}),
        ...(params.linkedUserId !== undefined
          ? { linkedUserId: params.linkedUserId || null }
          : {}),
      },
    });
  }

  // -------- Attendance --------

  /** Idempotent: a second check-in the same day returns the existing
   *  row instead of erroring (matches the existing UI's behaviour). */
  async checkIn(employeeId: string, note?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (!employee.active) throw new BadRequestException('Employee is inactive');

    const date = todayKey();
    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (existing) return existing;

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date,
        checkInAt: new Date(),
        note: note?.trim() || null,
      },
    });
  }

  /** Marks today's check-out. No-op if not checked in or already out. */
  async checkOut(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const date = todayKey();
    const today = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!today) throw new BadRequestException('Not checked in today');
    if (today.checkOutAt) return today;

    return this.prisma.attendance.update({
      where: { id: today.id },
      data: { checkOutAt: new Date() },
    });
  }

  listAttendance(params: { branchSlug?: string; date?: string; employeeId?: string } = {}) {
    const where: Prisma.AttendanceWhereInput = {};
    if (params.date) where.date = params.date;
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.branchSlug) {
      where.employee = { branchSlug: params.branchSlug };
    }
    return this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { checkInAt: 'desc' }],
    });
  }

  // -------- Salary disbursements --------

  async recordDisbursement(
    employeeId: string,
    period: string,
    amount: number,
    paidById: string,
    notes?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException('period must be yyyy-mm');
    }
    if (amount <= 0) throw new BadRequestException('amount must be positive');

    return this.prisma.salaryDisbursement.create({
      data: {
        employeeId,
        period,
        amount,
        paidById,
        notes: notes?.trim() || null,
      },
    });
  }

  listDisbursements(params: { employeeId?: string; branchSlug?: string } = {}) {
    const where: Prisma.SalaryDisbursementWhereInput = {};
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.branchSlug) {
      where.employee = { branchSlug: params.branchSlug };
    }
    return this.prisma.salaryDisbursement.findMany({
      where,
      orderBy: { paidAt: 'desc' },
    });
  }
}
