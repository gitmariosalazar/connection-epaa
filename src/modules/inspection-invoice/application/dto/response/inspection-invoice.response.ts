import { UUID } from 'crypto';

export interface InspectionInvoiceResponse {
  invoiceId: string;
  requestId: string;
  invoiceNumber: string;
  conceptId: number;
  amount: number;
  status: string;
  expirationDate: Date;
  paymentDate: Date | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  proofOfPayment: string | null;
  collectorId: UUID | null;
  createdAt: Date;
  updatedAt: Date;
}
