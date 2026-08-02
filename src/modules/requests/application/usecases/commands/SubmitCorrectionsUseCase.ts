import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { INotificationPort } from '../../../../../shared/notifications/notification.port';
import { statusCode } from '../../../../../settings/environments/status-code';
import { SubmitCorrectionsRequest } from '../../dto/request/submit-corrections.request';

/**
 * FASE ÚNICA — Operación atómica: Actualizar documentos + Transicionar a DOCS_SUBMITTED
 *
 * SRP: Única responsabilidad — recibir correcciones en lote, actualizarlas en BD y cambiar el estado.
 */
@Injectable()
export class SubmitCorrectionsUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
    @Inject('INotificationPort')
    private readonly notifications: INotificationPort,
  ) {}

  async execute(dto: SubmitCorrectionsRequest): Promise<void> {
    // 1. Ejecutar transacción atómica de actualización y transición de estado
    try {
      await this.repository.submitCorrections(dto);
    } catch (error) {
      const message = (error as Error).message ?? '';
      if (message.includes('no existe en public.usuarios')) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: `El userId enviado (${dto.userId}) no corresponde a un usuario o cliente válido.`,
        });
      }
      throw error;
    }

    // 2. Notificaciones fire-and-forget
    // Podríamos notificar al analista que se han subido correcciones.
    // Esto se haría obteniendo el ID del analista previamente asignado,
    // pero por ahora podemos mantenerlo simple.

    // Aquí puedes agregar la llamada a this.notifications si es necesario
  }
}
