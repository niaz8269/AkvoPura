import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Branch, Role } from '@prisma/client';
import type { Request } from 'express';

import { UsersService } from './users.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('branch') branchQ?: string,
    @Query('role') roleQ?: string,
  ) {
    const me = req.user as JwtPayload;

    // Validate filter inputs against the enums.
    let branch: Branch | undefined;
    if (branchQ) {
      if (!Object.values(Branch).includes(branchQ as Branch)) {
        throw new BadRequestException(`Unknown branch: ${branchQ}`);
      }
      branch = branchQ as Branch;
    }

    let role: Role | undefined;
    if (roleQ) {
      if (!Object.values(Role).includes(roleQ as Role)) {
        throw new BadRequestException(`Unknown role: ${roleQ}`);
      }
      role = roleQ as Role;
    }

    // Role-based access scoping:
    //  - owner   : sees everyone
    //  - manager : sees only own-branch users (filter forced)
    //  - others  : forbidden
    if (me.role === 'owner') {
      return this.users.list({ branch, role });
    }
    if (me.role === 'manager') {
      if (!me.branch) {
        throw new ForbiddenException('Manager has no branch assigned');
      }
      // If a different branch was requested, deny.
      if (branch && branch !== me.branch) {
        throw new ForbiddenException('Cannot list users of another branch');
      }
      return this.users.list({ branch: me.branch as Branch, role });
    }

    throw new ForbiddenException('Insufficient privileges');
  }
}
