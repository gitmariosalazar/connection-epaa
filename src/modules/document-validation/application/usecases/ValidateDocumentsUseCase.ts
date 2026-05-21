import { Inject, Injectable } from '@nestjs/common';
import { InterfaceDocumentValidationRepository } from '../../domain/contracts/document-validation.interface.repository';
import { ValidateDocumentsRequest } from '../dto/request/validate-documents.request';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

/**
 * Fase 3: Validación Documental (DOCS_APPROVED / DOCS_REJECTED)
 * SRP: Única responsabilidad — procesar la validación en lote de documentos
 * y disparar la transición de estado correcta vía la función de la BD.
 */
@Injectable()
export class ValidateDocumentsUseCase {
  constructor(
    @Inject('InterfaceDocumentValidationRepository')
    private readonly repository: InterfaceDocumentValidationRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(
    solicitudId: string,
    dto: ValidateDocumentsRequest,
  ): Promise<{ success: boolean; solicitudId: string; newStatus: string }> {
    // 1. Validar cada documento individualmente
    for (const decision of dto.decisions) {
      await this.repository.validateDocument(
        decision.documentId,
        decision.validationStatus,
        decision.observation ?? null,
        dto.validatorId,
      );
    }

    // 2. Determinar el estado global de la solicitud
    const allApproved = dto.decisions.every(
      (d) => d.validationStatus === 'APROBADO',
    );
    const newStatus = allApproved ? 'DOCS_APPROVED' : 'DOCS_REJECTED';
    const comment = allApproved
      ? 'Documentación revisada y aprobada por el analista'
      : 'Documentación revisada, existen documentos rechazados';

    // 3. Cambiar estado via fn_cambiar_estado_solicitud (nunca UPDATE directo)
    await this.repository.changeRequestStatus(
      solicitudId,
      newStatus,
      dto.validatorId,
      comment,
    );

    // 4. Notificar al cliente según el resultado (Fase 3 completa)
    const clientId = await this.repository.getClientIdBySolicitud(solicitudId);
    if (clientId) {
      if (newStatus === 'DOCS_REJECTED') {
        this.notification.notifyDocsRechazados(
          clientId, solicitudId,
          'Uno o más documentos presentan observaciones. Revise el detalle en el sistema.',
        );
      } else {
        this.notification.notifyDocsAprobados(clientId, solicitudId);
      }
    }

    return { success: true, solicitudId, newStatus };
  }
}
