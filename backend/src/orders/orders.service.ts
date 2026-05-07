import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerOrderStatus,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type OrderItem = {
  productId: 'cans' | 'gallons' | 'pet600' | 'pet1500';
  qty: number;
  unitPrice: number;
};

export type PlaceOrderParams = {
  branchSlug: string;
  customerUserId: string;
  customerName: string;
  items: OrderItem[];
  preferredTime?: string;
  notes?: string;
};

export type ListOrdersParams = {
  branchSlug?: string;
  customerUserId?: string;
  assignedSalesmanId?: string;
  status?: CustomerOrderStatus;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: ListOrdersParams = {}) {
    const where: Prisma.CustomerOrderWhereInput = {};
    if (params.branchSlug) where.branchSlug = params.branchSlug;
    if (params.customerUserId) where.customerUserId = params.customerUserId;
    if (params.assignedSalesmanId) where.assignedSalesmanId = params.assignedSalesmanId;
    if (params.status) where.status = params.status;
    return this.prisma.customerOrder.findMany({
      where,
      orderBy: [{ status: 'asc' }, { placedAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.customerOrder.findUnique({ where: { id } });
  }

  async place(params: PlaceOrderParams) {
    const branch = await this.prisma.branch.findUnique({
      where: { slug: params.branchSlug },
    });
    if (!branch) throw new BadRequestException(`Unknown branch: ${params.branchSlug}`);
    const totalAmount = params.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    return this.prisma.customerOrder.create({
      data: {
        branchSlug: params.branchSlug,
        customerUserId: params.customerUserId,
        customerName: params.customerName,
        items: params.items as unknown as Prisma.JsonArray,
        totalAmount,
        preferredTime: params.preferredTime?.trim() || null,
        notes: params.notes?.trim() || null,
        status: CustomerOrderStatus.pending,
      },
    });
  }

  async update(
    id: string,
    updaterId: string,
    data: {
      status?: CustomerOrderStatus;
      assignedSalesmanId?: string;
      assignedSalesmanName?: string;
      managerNote?: string;
    },
  ) {
    const target = await this.prisma.customerOrder.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Order not found');
    return this.prisma.customerOrder.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.assignedSalesmanId !== undefined
          ? { assignedSalesmanId: data.assignedSalesmanId }
          : {}),
        ...(data.assignedSalesmanName !== undefined
          ? { assignedSalesmanName: data.assignedSalesmanName }
          : {}),
        ...(data.managerNote !== undefined ? { managerNote: data.managerNote } : {}),
        updatedById: updaterId,
      },
    });
  }
}
