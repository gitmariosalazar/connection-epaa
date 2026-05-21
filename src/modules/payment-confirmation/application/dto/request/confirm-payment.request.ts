export class ConfirmPaymentRequest {
  invoiceId: string;
  paymentMethod: string;
  paymentReference: string;
  proofOfPaymentUrl?: string;
  collectorId: string; // UUID del cajero
}
