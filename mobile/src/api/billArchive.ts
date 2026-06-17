/**
 * Bill archive — fire-and-forget call that emails a copy of the bill
 * to akvopura4@gmail.com when a salesman closes a customer's screen.
 */

import { apiRequest } from './client';

export type ArchiveBillInput = {
  customerName: string;
  customerType: 'Pets' | 'Cans/Gallons';
  branchName: string;
  salesmanName?: string;
  totalRs: number;
  paidRs: number;
  creditRs: number;
  itemsSummary: string;
  pdfBase64?: string;
  pdfFilename?: string;
};

export function archiveBillEmail(input: ArchiveBillInput) {
  return apiRequest<{ ok: boolean; reason?: string }>('/email/bill-archive', {
    method: 'POST',
    body: input,
  });
}
