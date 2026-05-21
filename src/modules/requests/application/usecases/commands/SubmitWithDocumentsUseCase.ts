import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { INotificationPort } from '../../../../../shared/notifications/notification.port';
import { SubmitWithDocumentsRequest, SubmitWithDocumentsResponse } from '../../dto/request/submit-with-documents.request';

/**
 * FASE ÚNICA — Operación atómica: Crear Solicitud + Documentos + DOCS_SUBMITTED
 *
 * SRP: Única responsabilidad — orquestar la entrega completa del expediente.
 * Tras el COMMIT exitoso, emite notificación fire-and-forget al analista.
 * La notificación NUNCA bloquea ni revierte la transacción principal.
 */
@Injectable()
export class SubmitWithDocumentsUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
    @Inject('INotificationPort')
    private readonly notifications: INotificationPort,
  ) {}

  async execute(dto: SubmitWithDocumentsRequest): Promise<SubmitWithDocumentsResponse> {
    // Transacción atómica en la persistencia
    const result = await this.repository.submitWithDocuments(dto);

    // Notificación fire-and-forget — el analista recibe alerta de nueva solicitud
    // Si falla, NO afecta el resultado ya confirmado en BD
    try {
      this.notifications.notifyDocsSubmitted(
        dto.userId,
        result.solicitudId,
        result.documentosInsertados,
      );
    } catch {
      // Ignorado intencionalmente — la notificación es best-effort
    }

    return result;
  }
}
