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
import {
  ComplaintStatus,
  Role,
} from '@prisma/client';
import type { Request } from 'express';

import { ComplaintsService } from './complaints.service';
import { FileComplaintDto } from './dto/file-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { PostCommentDto } from './dto/post-comment.dto';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('complaints')
@UseGuards(AuthGuard('jwt'))
export class ComplaintsController {
  constructor(
    private readonly complaints: ComplaintsService,
    private readonly users: UsersService,
  ) {}

  @Get('mine')
  listMine(@Req() req: Request) {
    const me = req.user as JwtPayload;
    return this.complaints.list({ customerUserId: me.sub });
  }

  /** Branch-scoped inbox.
   *   - Owner: any branch
   *   - Manager: own branch
   *   - Customer: own (use /mine instead) */
  @Get()
  list(
    @Req() req: Request,
    @Query('branchSlug') branchSlugQ?: string,
    @Query('status') statusQ?: string,
  ) {
    const me = req.user as JwtPayload;
    let status: ComplaintStatus | undefined;
    if (statusQ) {
      if (!Object.values(ComplaintStatus).includes(statusQ as ComplaintStatus)) {
        throw new BadRequestException(`Unknown status: ${statusQ}`);
      }
      status = statusQ as ComplaintStatus;
    }

    if (me.role === Role.owner) {
      return this.complaints.list({ branchSlug: branchSlugQ, status });
    }
    if (me.role === Role.manager) {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      if (branchSlugQ && branchSlugQ !== me.branch) {
        throw new ForbiddenException('Cannot list other branch complaints');
      }
      return this.complaints.list({ branchSlug: me.branch, status });
    }
    if (me.role === Role.customer) {
      return this.complaints.list({ customerUserId: me.sub });
    }
    throw new ForbiddenException('Insufficient privileges');
  }

  @Post()
  async file(@Req() req: Request, @Body() dto: FileComplaintDto) {
    const me = req.user as JwtPayload;
    let branchSlug = dto.branchSlug;
    if (!branchSlug) {
      if (!me.branch) throw new ForbiddenException('No branch assigned');
      branchSlug = me.branch;
    } else if (me.role !== Role.owner && branchSlug !== me.branch) {
      throw new ForbiddenException('Cannot file in another branch');
    }
    const customer = await this.users.findById(me.sub);
    if (!customer) throw new ForbiddenException('User not found');
    return this.complaints.file({
      branchSlug,
      customerUserId: me.sub,
      customerName: customer.name,
      category: dto.category,
      recipient: dto.recipient,
      description: dto.description,
    });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    const me = req.user as JwtPayload;
    const target = await this.complaints.findById(id);
    if (!target) throw new NotFoundException('Complaint not found');

    // Branch scoping for non-owner roles.
    if (me.role !== Role.owner && me.branch !== target.branchSlug) {
      throw new ForbiddenException('Complaint is in another branch');
    }

    if (me.role === Role.customer) {
      // Customers can only set rating after resolved.
      if (target.customerUserId !== me.sub) {
        throw new ForbiddenException('Not your complaint');
      }
      if (dto.status !== undefined) {
        throw new ForbiddenException('Customer cannot change status');
      }
      if (dto.rating !== undefined && target.status !== ComplaintStatus.resolved) {
        throw new BadRequestException('Can only rate after resolution');
      }
      return this.complaints.update(id, me.sub, { rating: dto.rating });
    }

    if (me.role === Role.manager || me.role === Role.owner) {
      return this.complaints.update(id, me.sub, dto);
    }

    throw new ForbiddenException('Insufficient privileges');
  }

  // ---- comments thread ----

  @Get(':id/comments')
  async listComments(@Req() req: Request, @Param('id') id: string) {
    const me = req.user as JwtPayload;
    const target = await this.complaints.findById(id);
    if (!target) throw new NotFoundException('Complaint not found');
    this.assertCanView(me, target);
    return this.complaints.listComments(id);
  }

  @Post(':id/comments')
  async postComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: PostCommentDto,
  ) {
    const me = req.user as JwtPayload;
    const target = await this.complaints.findById(id);
    if (!target) throw new NotFoundException('Complaint not found');
    this.assertCanView(me, target);

    const author = await this.users.findById(me.sub);
    if (!author) throw new ForbiddenException('User not found');
    return this.complaints.postComment(
      id,
      { id: me.sub, name: author.name, role: author.role },
      dto.body,
    );
  }

  /** Shared check: customer can only see own; manager / owner same
   *  branch; salesman currently can't view (no UI for them). */
  private assertCanView(
    me: JwtPayload,
    target: { branchSlug: string; customerUserId: string },
  ) {
    if (me.role === Role.owner) return;
    if (me.role === Role.manager) {
      if (me.branch !== target.branchSlug) {
        throw new ForbiddenException('Complaint is in another branch');
      }
      return;
    }
    if (me.role === Role.customer) {
      if (target.customerUserId !== me.sub) {
        throw new ForbiddenException('Not your complaint');
      }
      return;
    }
    throw new ForbiddenException('Insufficient privileges');
  }
}
