import { UUID } from 'crypto';

export interface InspectionInvoiceSqlResult {
  invoice_id: string;
  request_id: string;
  invoice_number: string;
  concept_id: number;
  amount: number;
  status: string;
  expiration_date: Date;
  payment_date: Date | null;
  payment_method: string | null;
  payment_reference: string | null;
  proof_of_payment: string | null;
  collector_id: UUID | null;
  created_at: Date;
  updated_at: Date;
}
