import { CustomerOrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  /** New status. Customer can move pending → cancelled. Manager can move
   *  pending → assigned (with assignedSalesmanId), assigned → in_transit
   *  (or salesman can), in_transit → delivered, anywhere → cancelled. */
  @IsOptional() @IsEnum(CustomerOrderStatus)
  status?: CustomerOrderStatus;

  @IsOptional() @IsString()
  assignedSalesmanId?: string;

  @IsOptional() @IsString()
  managerNote?: string;
}
