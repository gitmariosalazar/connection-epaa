import { UUID } from 'crypto';

export class CreateInspectionInvoiceRequest {
  constructor(
    public readonly requestId: string,
    public readonly invoiceNumber: string,
    public readonly conceptId: number,
    public readonly amount: number,
    public readonly expirationDate: Date,
    public readonly paymentMethod?: string,
    public readonly paymentReference?: string,
    public readonly proofOfPayment?: string,
    public readonly collectorId?: UUID,
  ) {}
}
