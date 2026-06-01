import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInspectionInvoiceRepository } from '../../../../domain/contracts/inspection-invoice.interface.repository';
import { InspectionInvoiceModel } from '../../../../domain/schemas/models/InspectionInvoiceModel';
import { InspectionInvoiceSqlResult } from '../../../interfaces/sql/inspection-invoice.sql.result';
import { InspectionInvoiceAdapter } from '../../../adapters/inspection-invoice.adapter';

@Injectable()
export class InspectionInvoicePostgreSqlPersistence implements InterfaceInspectionInvoiceRepository {
  // Implement your PostgreSQL persistence logic here
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async createInspectionInvoice(
    inspectionInvoice: InspectionInvoiceModel,
  ): Promise<InspectionInvoiceModel | null> {
    try {
      const query = `
      INSERT INTO acometidas.factura_inspeccion (  
          id_solicitud, numero_factura, id_concepto, monto, fecha_vencimiento  
      ) VALUES ($1, $2, $3, $4, $5) RETURNING
        id_factura AS invoice_id,
        id_solicitud AS request_id,
        numero_factura AS invoice_number,
        id_concepto AS concept_id,
        monto AS amount,
        estado AS status,
        fecha_vencimiento AS expiration_date,
        fecha_pago AS payment_date,
        metodo_pago AS payment_method,
        referencia_pago AS payment_reference,
        url_comprobante AS proof_of_payment,
        id_cajero AS collector_id,
        created_at AS created_at,
        updated_at AS updated_at
        ;
      `;
      const values = [
        inspectionInvoice.requestId,
        inspectionInvoice.invoiceNumber,
        inspectionInvoice.conceptId,
        inspectionInvoice.amount,
        inspectionInvoice.expirationDate,
      ];
      const result =
        await this.databaseService.query<InspectionInvoiceSqlResult>(
          query,
          values,
        );
      if (result.length === 0) {
        return null;
      }
      const model: InspectionInvoiceModel = InspectionInvoiceAdapter.toResponse(
        result[0],
      );
      return model;
    } catch (error) {
      throw error;
    }
  }

  async updateInspectionInvoice(
    invoiceId: string,
    updatedFields: Partial<InspectionInvoiceModel>,
  ): Promise<InspectionInvoiceModel | null> {
    try {
      const query = `
        UPDATE acometidas.factura_inspeccion
        SET estado = $1,
            fecha_pago = $2,
            metodo_pago = $3,
            referencia_pago = $4,
            url_comprobante = $5,
            id_cajero = $6,
            updated_at = NOW()
        WHERE id_factura = $7
        RETURNING
          id_factura AS invoice_id,
          id_solicitud AS request_id,
          numero_factura AS invoice_number,
          id_concepto AS concept_id,
          monto AS amount,
          estado AS status,
          fecha_vencimiento AS expiration_date,
          fecha_pago AS payment_date,
          metodo_pago AS payment_method,
          referencia_pago AS payment_reference,
          url_comprobante AS proof_of_payment,
          id_cajero AS collector_id,
          created_at AS created_at,
          updated_at AS updated_at
      `;

      const result =
        await this.databaseService.query<InspectionInvoiceSqlResult>(query, [
          updatedFields.status,
          updatedFields.paymentDate,
          updatedFields.paymentMethod,
          updatedFields.paymentReference,
          updatedFields.proofOfPayment,
          updatedFields.collectorId,
          invoiceId,
        ]);
      if (result.length === 0) {
        return null;
      }
      const model: InspectionInvoiceModel = InspectionInvoiceAdapter.toResponse(
        result[0],
      );
      return model;
    } catch (error) {
      throw error;
    }
  }

  async getInspectionInvoiceById(
    invoiceId: string,
  ): Promise<InspectionInvoiceModel | null> {
    try {
      const query = `
        SELECT
          id_factura AS invoice_id,
          id_solicitud AS request_id,
          numero_factura AS invoice_number,
          id_concepto AS concept_id,
          monto AS amount,
          estado AS status,
          fecha_vencimiento AS expiration_date,
          fecha_pago AS payment_date,
          metodo_pago AS payment_method,
          referencia_pago AS payment_reference,
          url_comprobante AS proof_of_payment,
          id_cajero AS collector_id,
          created_at AS created_at,
          updated_at AS updated_at
        FROM acometidas.factura_inspeccion
        WHERE id_factura = $1
      `;
      const result =
        await this.databaseService.query<InspectionInvoiceSqlResult>(query, [
          invoiceId,
        ]);
      if (result.length === 0) {
        return null;
      }
      const model: InspectionInvoiceModel = InspectionInvoiceAdapter.toResponse(
        result[0],
      );
      return model;
    } catch (error) {
      throw error;
    }
  }

  async findAllInspectionInvoices(
    limit: number,
    offset: number,
  ): Promise<InspectionInvoiceModel[]> {
    try {
      const query = `
        SELECT
          id_factura AS invoice_id,
          id_solicitud AS request_id,
          numero_factura AS invoice_number,
          id_concepto AS concept_id,
          monto AS amount,
          estado AS status,
          fecha_vencimiento AS expiration_date,
          fecha_pago AS payment_date,
          metodo_pago AS payment_method,
          referencia_pago AS payment_reference,
          url_comprobante AS proof_of_payment,
          id_cajero AS collector_id,
          created_at AS created_at,
          updated_at AS updated_at
        FROM acometidas.factura_inspeccion
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const result =
        await this.databaseService.query<InspectionInvoiceSqlResult>(query, [
          limit,
          offset,
        ]);
      return result.map((sqlResult) =>
        InspectionInvoiceAdapter.toResponse(sqlResult),
      );
    } catch (error) {
      throw error;
    }
  }

  async findAllInspectionInvoicesByRequestId(
    requestId: string,
    limit: number,
    offset: number,
  ): Promise<InspectionInvoiceModel[]> {
    try {
      const query = `
        SELECT
          id_factura AS invoice_id,
          id_solicitud AS request_id,
          numero_factura AS invoice_number,
          id_concepto AS concept_id,
          monto AS amount,
          estado AS status,
          fecha_vencimiento AS expiration_date,
          fecha_pago AS payment_date,
          metodo_pago AS payment_method,
          referencia_pago AS payment_reference,
          url_comprobante AS proof_of_payment,
          id_cajero AS collector_id,
          created_at AS created_at,
          updated_at AS updated_at
        FROM acometidas.factura_inspeccion
        WHERE id_solicitud = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result =
        await this.databaseService.query<InspectionInvoiceSqlResult>(query, [
          requestId,
          limit,
          offset,
        ]);
      return result.map((sqlResult) =>
        InspectionInvoiceAdapter.toResponse(sqlResult),
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteInspectionInvoice(invoiceId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE acometidas.factura_inspeccion
        SET estado = 'ANULADO'
        WHERE id_factura = $1
      `;
      const result = await this.databaseService.execute(query, [invoiceId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  async getClientIdBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ id_cliente: string }>(
      `SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].id_cliente : null;
  }
}
