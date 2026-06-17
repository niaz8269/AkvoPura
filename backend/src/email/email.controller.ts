import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { EmailService } from './email.service';
import { ArchiveBillDto } from './dto/archive-bill.dto';

/**
 * Internal email routes. Currently only the bill-archive endpoint —
 * salesmen fire this when they close a customer's delivery/sell screen.
 */
@Controller('email')
@UseGuards(AuthGuard('jwt'))
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post('bill-archive')
  archive(@Body() dto: ArchiveBillDto) {
    return this.email.sendBillArchive({
      customerName: dto.customerName,
      customerType: dto.customerType,
      branchName: dto.branchName,
      salesmanName: dto.salesmanName,
      totalRs: dto.totalRs,
      paidRs: dto.paidRs,
      creditRs: dto.creditRs,
      itemsSummary: dto.itemsSummary,
      pdfBase64: dto.pdfBase64,
      pdfFilename: dto.pdfFilename,
    });
  }
}
