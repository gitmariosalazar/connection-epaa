import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfacePaymentConfirmationRepository } from '../../domain/contracts/payment-confirmation.interface.repository';
import { ConfirmPaymentRequest } from '../dto/request/confirm-payment.request';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

/**
 * Fase 11: Confirmación de Pago (PAGO_CONFIRMADO)
 * SRP: Marca la factura como pagada y dispara la transición de estado.
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject('InterfacePaymentConfirmationRepository')
    private readonly repository: InterfacePaymentConfirmationRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(dto: ConfirmPaymentRequest): Promise<{ solicitudId: string; newStatus: string }> {
    // 1. Actualizar la factura y obtener el id_solicitud relacionado
    const solicitudId = await this.repository.confirmInvoicePayment(
      dto.invoiceId,
      dto.paymentMethod,
      dto.paymentReference,
      dto.proofOfPaymentUrl ?? null,
      dto.collectorId,
    );

    if (!solicitudId) {
      throw new NotFoundException(`Factura ${dto.invoiceId} no encontrada`);
    }

    // 2. Disparar transición de estado (siempre via función BD)
    await this.repository.changeRequestStatus(
      solicitudId,
      'PAGO_CONFIRMADO',
      dto.collectorId,
      'Pago de inspección recibido y confirmado exitosamente',
    );

    // 3. Notificar al cliente que su pago fue confirmado (Fase 11)
    const clientId = await this.repository.getClientIdBySolicitud(solicitudId);
    if (clientId) {
      this.notification.notifyPagoConfirmado(clientId, solicitudId);
    }

    return { solicitudId, newStatus: 'PAGO_CONFIRMADO' };
  }
}
