import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplaintCategory,
  ComplaintRecipient,
  ComplaintStatus,
  Role,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type FileComplaintParams = {
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  category: ComplaintCategory;
  recipient: ComplaintRecipient;
  description: string;
};

export type ListComplaintsParams = {
  branchSlug?: string;
  customerUserId?: string;
  status?: ComplaintStatus;
};

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: ListComplaintsParams = {}) {
    const where: Prisma.ComplaintWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (params.customerUserId) where.customerUserId = params.customerUserId;
    if (params.status) where.status = params.status;
    return this.prisma.complaint.findMany({
      where,
      orderBy: [{ status: 'asc' }, { filedAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.complaint.findUnique({ where: { id } });
  }

  async file(params: FileComplaintParams) {
    const branch = await this.prisma.branch.findUnique({
      where: { slug: params.branchSlug },
    });
    if (!branch) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);
    return this.prisma.complaint.create({
      data: {
        branchSlug: params.branchSlug,
        customerUserId: params.customerUserId,
        customerName: params.customerName,
        category: params.category,
        recipient: params.recipient,
        description: params.description.trim(),
        status: ComplaintStatus.open,
      },
    });
  }

  async update(
    id: string,
    deciderId: string,
    data: { status?: ComplaintStatus; rating?: number },
  ) {
    const target = await this.prisma.complaint.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Complaint not found');

    const patch: Prisma.ComplaintUpdateInput = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      if (data.status === ComplaintStatus.resolved && !target.resolvedAt) {
        patch.resolvedAt = new Date();
      }
      patch.decidedById = deciderId;
    }
    if (data.rating !== undefined) {
      patch.rating = data.rating;
    }

    return this.prisma.complaint.update({ where: { id }, data: patch });
  }

  // ---- comments thread ----

  listComments(complaintId: string) {
    return this.prisma.complaintComment.findMany({
      where: { complaintId },
      orderBy: { postedAt: 'asc' },
    });
  }

  async postComment(
    complaintId: string,
    author: { id: string; name: string; role: Role },
    body: string,
  ) {
    const exists = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!exists) throw new NotFoundException('Complaint not found');
    return this.prisma.complaintComment.create({
      data: {
        complaintId,
        authorId: author.id,
        authorName: author.name,
        authorRole: author.role,
        body: body.trim(),
      },
    });
  }
}
