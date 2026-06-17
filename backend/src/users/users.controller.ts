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
import { Role } from '@prisma/client';
import type { Request } from 'express';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ---- helpers --------------------------------------------------------

  private assertAdmin(me: JwtPayload) {
    if (me.role !== 'owner' && me.role !== 'manager') {
      throw new ForbiddenException('Insufficient privileges');
    }
  }

  /** Owner: anywhere. Manager: only their own branch. */
  private assertBranchAccess(me: JwtPayload, branchSlug: string | null | undefined) {
    if (me.role === 'owner') return;
    if (me.role !== 'manager') {
      throw new ForbiddenException('Insufficient privileges');
    }
    if (!me.branch) throw new ForbiddenException('Manager has no branch assigned');
    if (branchSlug && branchSlug !== me.branch) {
      throw new ForbiddenException('Cannot manage users of another branch');
    }
  }

  /** Manager cannot create or modify owners or managers. */
  private assertCanAssignRole(me: JwtPayload, role: Role) {
    if (me.role === 'owner') return;
    if (role === 'owner' || role === 'manager') {
      throw new ForbiddenException(
        'Only the owner can create or modify owner / manager accounts',
      );
    }
  }

  // ---- endpoints ------------------------------------------------------

  /**
   * Pending customer registrations awaiting branch-manager approval.
   * Always scoped to the caller's branch (owner not expected to verify).
   */
  @Get('pending')
  async listPending(@Req() req: Request) {
    const me = req.user as JwtPayload;
    if (me.role !== 'manager' && me.role !== 'owner') {
      throw new ForbiddenException('Only managers and the owner can view pending registrations');
    }
    if (me.role === 'manager' && !me.branch) {
      throw new ForbiddenException('Manager has no branch assigned');
    }
    // Owners see nothing here (they don't approve customers) unless we
    // later add an owner-only "all branches" filter. For now, owner gets
    // an empty list — managers are the ones who verify.
    if (me.role === 'owner') return [];
    return this.users.listPending(me.branch!);
  }

  /** Approve a pending customer + create their linked customer record. */
  @Post(':id/verify')
  async verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyUserDto,
  ) {
    const me = req.user as JwtPayload;
    if (me.role !== 'manager') {
      throw new ForbiddenException('Only branch managers can verify customer registrations');
    }
    if (!me.branch) throw new ForbiddenException('Manager has no branch assigned');

    const target = await this.users.findById(id);
    if (!target) throw new NotFoundException('User not found');
    if (target.branchSlug !== me.branch) {
      throw new ForbiddenException('Cannot verify a customer of another branch');
    }
    return this.users.verifyCustomer(id, dto);
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query('branchSlug') branchQ?: string,
    @Query('role') roleQ?: string,
  ) {
    const me = req.user as JwtPayload;

    let role: Role | undefined;
    if (roleQ) {
      if (!Object.values(Role).includes(roleQ as Role)) {
        throw new BadRequestException(`Unknown role: ${roleQ}`);
      }
      role = roleQ as Role;
    }

    if (me.role === 'owner') {
      return this.users.list({ branchSlug: branchQ, role });
    }
    if (me.role === 'manager') {
      if (!me.branch) throw new ForbiddenException('Manager has no branch assigned');
      if (branchQ && branchQ !== me.branch) {
        throw new ForbiddenException('Cannot list users of another branch');
      }
      return this.users.list({ branchSlug: me.branch, role });
    }
    throw new ForbiddenException('Insufficient privileges');
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateUserDto) {
    const me = req.user as JwtPayload;
    this.assertAdmin(me);
    this.assertCanAssignRole(me, dto.role);

    if (dto.role === 'owner' && dto.branchSlug) {
      throw new BadRequestException('Owner accounts cannot have a branch');
    }
    if (dto.role !== 'owner' && !dto.branchSlug) {
      throw new BadRequestException('branchSlug is required for this role');
    }
    this.assertBranchAccess(me, dto.branchSlug ?? null);

    return this.users.create({
      identifier: dto.identifier,
      name: dto.name,
      password: dto.password,
      role: dto.role,
      branchSlug: dto.branchSlug ?? null,
      linkedCgCustomerId: dto.linkedCgCustomerId,
    });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertAdmin(me);

    const target = await this.users.findById(id);
    if (!target) throw new NotFoundException('User not found');

    if (target.id === me.sub && dto.active === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    this.assertBranchAccess(me, target.branchSlug);
    if (dto.branchSlug !== undefined) this.assertBranchAccess(me, dto.branchSlug);
    if (dto.role !== undefined) this.assertCanAssignRole(me, dto.role);
    this.assertCanAssignRole(me, target.role);

    return this.users.update(id, dto);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    const me = req.user as JwtPayload;
    this.assertAdmin(me);

    const target = await this.users.findById(id);
    if (!target) throw new NotFoundException('User not found');
    this.assertBranchAccess(me, target.branchSlug);
    this.assertCanAssignRole(me, target.role);

    return this.users.resetPassword(id, dto.newPassword);
  }
}
