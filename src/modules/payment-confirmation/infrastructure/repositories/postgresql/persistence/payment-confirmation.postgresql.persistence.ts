import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfacePaymentConfirmationRepository } from '../../../../domain/contracts/payment-confirmation.interface.repository';

@Injectable()
export class PaymentConfirmationPostgreSQLPersistence
  implements InterfacePaymentConfirmationRepository
{
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async confirmInvoicePayment(
    invoiceId: string,
    paymentMethod: string,
    paymentReference: string,
    proofOfPaymentUrl: string | null,
    collectorId: string,
  ): Promise<string | null> {
    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `UPDATE acometidas.factura_inspeccion
       SET estado = 'PAGADO',
           fecha_pago = NOW(),
           metodo_pago = $1,
           referencia_pago = $2,
           url_comprobante = $3,
           id_cajero = $4,
           updated_at = NOW()
       WHERE id_factura = $5
       RETURNING id_solicitud`,
      [paymentMethod, paymentReference, proofOfPaymentUrl, collectorId, invoiceId],
    );
    return result.length > 0 ? result[0].id_solicitud : null;
  }

  async changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void> {
    await this.databaseService.query(
      `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
      [solicitudId, newStatus, userId, comment],
    );
  }

  async getClientIdBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ id_cliente: string }>(
      `SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].id_cliente : null;
  }
}
