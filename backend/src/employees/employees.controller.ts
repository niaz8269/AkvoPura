import {
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
import { Role } from '@prisma/client';
import type { Request } from 'express';

import { EmployeesService } from './employees.service';
import {
  CheckInDto,
  CreateEmployeeDto,
  RecordDisbursementDto,
  UpdateEmployeeDto,
} from './dto/create-employee.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('employees')
@UseGuards(AuthGuard('jwt'))
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  /** Owner: any branch (or all). Manager: own branch only. */
  private resolveScope(me: JwtPayload, branchQ?: string): string | undefined {
    if (me.role === Role.owner) return branchQ;
    if (!me.branch) throw new ForbiddenException('No branch assigned');
    if (branchQ && branchQ !== me.branch) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return me.branch;
  }

  private assertManage(me: JwtPayload) {
    if (me.role !== Role.owner && me.role !== Role.manager) {
      throw new ForbiddenException('Only manager / owner can manage employees');
    }
  }

  // -------- Employees CRUD --------

  @Get()
  list(
    @Req() req: Request,
    @Query('branchSlug') branchSlug?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    return this.employees.list({
      branchSlug: this.resolveScope(me, branchSlug),
      includeInactive: includeInactive === 'true',
    });
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateEmployeeDto) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    const branchSlug = dto.branchSlug ?? me.branch;
    if (!branchSlug) throw new ForbiddenException('No branch assigned');
    this.resolveScope(me, branchSlug);
    return this.employees.create({
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      branchSlug,
      employmentType: dto.employmentType,
      monthlySalary: dto.monthlySalary,
      hourlyRate: dto.hourlyRate,
      notes: dto.notes,
      linkedUserId: dto.linkedUserId,
    });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    const target = await this.employees.findById(id);
    if (!target) throw new NotFoundException('Employee not found');
    this.resolveScope(me, target.branchSlug);
    return this.employees.update(id, dto);
  }

  // -------- Attendance --------

  /** Manager / owner check-in for an employee on this device.
   *  (The employee themself doesn't have a self-check-in flow yet —
   *  manager-driven for now to match the existing UI.) */
  @Post(':id/check-in')
  async checkIn(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CheckInDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    const target = await this.employees.findById(id);
    if (!target) throw new NotFoundException('Employee not found');
    this.resolveScope(me, target.branchSlug);
    return this.employees.checkIn(id, dto.note);
  }

  @Post(':id/check-out')
  async checkOut(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    const target = await this.employees.findById(id);
    if (!target) throw new NotFoundException('Employee not found');
    this.resolveScope(me, target.branchSlug);
    return this.employees.checkOut(id);
  }

  @Get('attendance')
  listAttendance(
    @Req() req: Request,
    @Query('date') date?: string,
    @Query('employeeId') employeeId?: string,
    @Query('branchSlug') branchSlug?: string,
  ) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    return this.employees.listAttendance({
      date,
      employeeId,
      branchSlug: this.resolveScope(me, branchSlug),
    });
  }

  // -------- Salary disbursements --------

  @Post(':id/disbursements')
  async recordDisbursement(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: RecordDisbursementDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    const target = await this.employees.findById(id);
    if (!target) throw new NotFoundException('Employee not found');
    this.resolveScope(me, target.branchSlug);
    return this.employees.recordDisbursement(
      id,
      dto.period,
      dto.amount,
      me.sub,
      dto.notes,
    );
  }

  @Get('disbursements')
  listDisbursements(
    @Req() req: Request,
    @Query('employeeId') employeeId?: string,
    @Query('branchSlug') branchSlug?: string,
  ) {
    const me = req.user as JwtPayload;
    this.assertManage(me);
    return this.employees.listDisbursements({
      employeeId,
      branchSlug: this.resolveScope(me, branchSlug),
    });
  }
}
