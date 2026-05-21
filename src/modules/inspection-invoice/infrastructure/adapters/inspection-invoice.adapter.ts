import { InspectionInvoiceModel } from '../../domain/schemas/models/InspectionInvoiceModel';
import { InspectionInvoiceSqlResult } from '../interfaces/sql/inspection-invoice.sql.result';

export class InspectionInvoiceAdapter {
  static toResponse(
    sqlResult: InspectionInvoiceSqlResult,
  ): InspectionInvoiceModel {
    return {
      invoiceId: sqlResult.invoice_id,
      requestId: sqlResult.request_id,
      invoiceNumber: sqlResult.invoice_number,
      conceptId: sqlResult.concept_id,
      amount: sqlResult.amount,
      status: sqlResult.status,
      expirationDate: sqlResult.expiration_date,
      paymentDate: sqlResult.payment_date,
      paymentMethod: sqlResult.payment_method,
      paymentReference: sqlResult.payment_reference,
      proofOfPayment: sqlResult.proof_of_payment,
      collectorId: sqlResult.collector_id,
      createdAt: sqlResult.created_at,
      updatedAt: sqlResult.updated_at,
    };
  }
}
