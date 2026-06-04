import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { INotificationPort } from '../../../../../shared/notifications/notification.port';
import {
  SubmitWithDocumentsRequest,
  SubmitWithDocumentsResponse,
} from '../../dto/request/submit-with-documents.request';

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

  async execute(
    dto: SubmitWithDocumentsRequest,
  ): Promise<SubmitWithDocumentsResponse> {
    // Transacción atómica: INSERT solicitud + round-robin analista + documentos + cambio de estado
    //console.log('Ejecutando SubmitWithDocumentsUseCase con DTO:', dto);
    const result = await this.repository.submitWithDocuments(dto);

    // Datos de la solicitud que se usan en AMBOS templates (analista y cliente)
    const solicitudData = {
      numeroSolicitud: result.numeroSolicitud,
      tipoAcometida: dto.connectionType ?? 'Nueva Acometida de Agua Potable',
      tipoPersona: dto.personType ?? 'No especificado',
      direccion: dto.address ?? 'No especificada',
      claveCatastral: dto.cadastralKey ?? 'No disponible',
    };

    // Notificaciones fire-and-forget — NUNCA bloquean ni revierten la transacción
    try {
      // ── Notificación 1: AL ANALISTA → EMAIL con template HTML + IN_APP ─────
      // Solo si el round-robin encontró un analista activo (cargo_id = 14)
      if (result.analistaId) {
        this.notifications.notifyAnalystNewSolicitud(
          result.analistaId,
          result.solicitudId,
          result.documentosInsertados,
          solicitudData,
        );
      }
    } catch {
      // Ignorado intencionalmente — la notificación al analista es best-effort
    }

    try {
      // ── Notificación 2: AL CLIENTE → EMAIL con template HTML + IN_APP ──────
      this.notifications.notifyDocsSubmitted(
        dto.userId,
        result.solicitudId,
        result.documentosInsertados,
        solicitudData,
      );
    } catch {
      // Ignorado intencionalmente — la notificación al cliente es best-effort
    }

    return result;
  }
}
