/**
 * EmailService — sends transactional emails via Gmail SMTP.
 *
 * Requires three env vars on Render:
 *   SMTP_USER         akvopura4@gmail.com (the sending Gmail account)
 *   SMTP_APP_PASSWORD 16-char Gmail App Password (NOT the Gmail login password)
 *   BILL_ARCHIVE_TO   destination address for bill copies (usually the same
 *                     account, akvopura4@gmail.com)
 *
 * If any of these is missing the service logs a warning and silently no-ops
 * — so the salesman's bill workflow keeps working even when SMTP isn't set
 * up yet.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type BillArchiveInput = {
  customerName: string;
  customerType: 'Pets' | 'Cans/Gallons';
  branchName: string;
  salesmanName?: string;
  totalRs: number;
  paidRs: number;
  creditRs: number;
  itemsSummary: string;
  /** Base64-encoded PDF, no data URL prefix. */
  pdfBase64?: string;
  /** Filename to use for the PDF attachment. */
  pdfFilename?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_APP_PASSWORD');
    if (!user || !pass) {
      this.logger.warn(
        'SMTP_USER / SMTP_APP_PASSWORD not set — bill archive emails will be skipped',
      );
      return;
    }
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async sendBillArchive(input: BillArchiveInput): Promise<{ ok: boolean; reason?: string }> {
    if (!this.transporter) {
      return { ok: false, reason: 'smtp_not_configured' };
    }
    const to = this.config.get<string>('BILL_ARCHIVE_TO');
    if (!to) {
      this.logger.warn('BILL_ARCHIVE_TO not set — skipping bill archive email');
      return { ok: false, reason: 'archive_recipient_not_set' };
    }

    const subject = `Bill — ${input.customerName} (${input.customerType})`;
    const body = [
      `Customer: ${input.customerName}`,
      `Type:     ${input.customerType}`,
      `Branch:   ${input.branchName}`,
      input.salesmanName ? `Salesman: ${input.salesmanName}` : null,
      '',
      `Items:    ${input.itemsSummary}`,
      `Total:    Rs ${input.totalRs.toLocaleString()}`,
      `Paid:     Rs ${input.paidRs.toLocaleString()}`,
      input.creditRs > 0 ? `Credit:   Rs ${input.creditRs.toLocaleString()}` : null,
      '',
      'Bill PDF attached.',
    ]
      .filter(Boolean)
      .join('\n');

    const attachments = input.pdfBase64
      ? [
          {
            filename: input.pdfFilename ?? `bill-${Date.now()}.pdf`,
            content: input.pdfBase64,
            encoding: 'base64' as const,
            contentType: 'application/pdf',
          },
        ]
      : [];

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_USER'),
        to,
        subject,
        text: body,
        attachments,
      });
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Bill archive email failed: ${msg}`);
      return { ok: false, reason: msg };
    }
  }
}
