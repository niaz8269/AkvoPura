import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('branches')
@UseGuards(AuthGuard('jwt'))
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  /** Anyone authenticated can list branches (needed for dropdowns). */
  @Get()
  list() {
    return this.branches.list();
  }

  /** Owner only. */
  @Post()
  create(@Req() req: Request, @Body() dto: CreateBranchDto) {
    const me = req.user as JwtPayload;
    if (me.role !== 'owner') {
      throw new ForbiddenException('Only the owner can create branches');
    }
    return this.branches.create(dto);
  }

  /** Owner only. */
  @Patch(':slug')
  update(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Body() dto: UpdateBranchDto,
  ) {
    const me = req.user as JwtPayload;
    if (me.role !== 'owner') {
      throw new ForbiddenException('Only the owner can edit branches');
    }
    return this.branches.update(slug, dto);
  }
}
