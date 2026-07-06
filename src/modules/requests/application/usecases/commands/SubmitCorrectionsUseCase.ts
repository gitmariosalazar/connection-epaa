import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { INotificationPort } from '../../../../../shared/notifications/notification.port';
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
    await this.repository.submitCorrections(dto);

    // 2. Notificaciones fire-and-forget
    // Podríamos notificar al analista que se han subido correcciones.
    // Esto se haría obteniendo el ID del analista previamente asignado,
    // pero por ahora podemos mantenerlo simple.
    
    // Aquí puedes agregar la llamada a this.notifications si es necesario
  }
}
