import { InspectionInvoiceModel } from '../schemas/models/InspectionInvoiceModel';

export interface InterfaceInspectionInvoiceRepository {
  createInspectionInvoice(
    inspectionInvoice: InspectionInvoiceModel,
  ): Promise<InspectionInvoiceModel | null>;

  getInspectionInvoiceById(
    invoiceId: string,
  ): Promise<InspectionInvoiceModel | null>;

  updateInspectionInvoice(
    invoiceId: string,
    updatedFields: Partial<InspectionInvoiceModel>,
  ): Promise<InspectionInvoiceModel | null>;

  deleteInspectionInvoice(invoiceId: string): Promise<boolean>;

  findAllInspectionInvoices(
    limit: number,
    offset: number,
  ): Promise<InspectionInvoiceModel[]>;

  findAllInspectionInvoicesByRequestId(
    requestId: string,
    limit: number,
    offset: number,
  ): Promise<InspectionInvoiceModel[]>;

  /** Devuelve el usuario_id del cliente dueño de la solicitud */
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
}
