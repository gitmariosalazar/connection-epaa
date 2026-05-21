import { UUID } from 'crypto';

export class InspectionInvoiceModel {
  constructor(
    public readonly invoiceId: string,
    public readonly requestId: string,
    public readonly invoiceNumber: string,
    public readonly conceptId: number,
    public readonly amount: number,
    public readonly status: string,
    public readonly expirationDate: Date,
    public readonly paymentDate: Date | null,
    public readonly paymentMethod: string | null,
    public readonly paymentReference: string | null,
    public readonly proofOfPayment: string | null,
    public readonly collectorId: UUID | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
