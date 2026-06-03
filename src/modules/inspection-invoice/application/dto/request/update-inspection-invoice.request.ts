import { UUID } from 'crypto';

export class UpdateInspectionInvoiceRequest {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber?: string,
    public readonly conceptId?: number,
    public readonly amount?: number,
    public readonly expirationDate?: Date,
    public readonly paymentDate?: Date,
    public readonly paymentMethod?: string,
    public readonly paymentReference?: string,
    public readonly proofOfPayment?: string,
    public readonly collectorId?: UUID,
    public readonly fileBase64?: string,
    public readonly originalName?: string,
    public readonly mimeType?: string,
  ) {}
}
