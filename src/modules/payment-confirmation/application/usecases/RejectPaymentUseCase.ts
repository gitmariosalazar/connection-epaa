import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfacePaymentConfirmationRepository } from '../../domain/contracts/payment-confirmation.interface.repository';
import { RejectPaymentRequest } from '../dto/request/reject-payment.request';

/**
 * Fase de Rechazo de Comprobante
 * SRP: Marca la factura sin comprobante y devuelve la solicitud a la fase anterior.
 */
@Injectable()
export class RejectPaymentUseCase {
  constructor(
    @Inject('InterfacePaymentConfirmationRepository')
    private readonly repository: InterfacePaymentConfirmationRepository,
  ) {}

  async execute(dto: RejectPaymentRequest): Promise<{ solicitudId: string; newStatus: string }> {
    // 1. Limpiar el comprobante en la factura y obtener el id_solicitud relacionado
    const solicitudId = await this.repository.rejectInvoicePayment(dto.invoiceId);

    if (!solicitudId) {
      throw new NotFoundException(`Factura ${dto.invoiceId} no encontrada`);
    }

    // 2. Disparar transición de estado (devolver a FACTURA_INSPECCION_EMITIDA)
    await this.repository.changeRequestStatus(
      solicitudId,
      'FACTURA_INSPECCION_EMITIDA',
      dto.adminId,
      `Comprobante de pago rechazado: ${dto.reason}`,
    );

    return { solicitudId, newStatus: 'FACTURA_INSPECCION_EMITIDA' };
  }
}
