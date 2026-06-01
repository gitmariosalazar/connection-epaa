import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceDocumentValidationRepository } from '../../../../domain/contracts/document-validation.interface.repository';
import { DocumentValidationModel } from '../../../../domain/schemas/models/DocumentValidationModel';

@Injectable()
export class DocumentValidationPostgreSQLPersistence
  implements InterfaceDocumentValidationRepository
{
  constructor(private readonly databaseService: DatabaseAbstract) {}

  /**
   * Mapea el valor de la API al valor del catálogo de la BD.
   * API:  APROBADO  → BD: VALIDO
   * API:  RECHAZADO → BD: INVALIDO
   * Cualquier otro valor (ej: PENDIENTE) se pasa sin cambio.
   */
  private mapStatusToDb(validationStatus: string): string {
    const map: Record<string, string> = {
      APROBADO:  'VALIDO',
      RECHAZADO: 'INVALIDO',
    };
    return map[validationStatus] ?? validationStatus;
  }

  async validateDocument(
    documentId: string,
    validationStatus: string,
    observation: string | null,
    validatorId: string,
  ): Promise<DocumentValidationModel | null> {
    // Convertir APROBADO/RECHAZADO → VALIDO/INVALIDO antes de persistir
    const dbStatus = this.mapStatusToDb(validationStatus);

    const query = `
      UPDATE acometidas.documento_adjunto
      SET estado_validacion = $1,
          observacion = $2,
          id_validador = $3,
          fecha_validacion = NOW(),
          updated_at = NOW()
      WHERE id_documento = $4
      RETURNING
        id_documento AS document_id,
        estado_validacion AS validation_status,
        observacion AS observation,
        id_validador AS validator_id,
        fecha_validacion AS validation_date,
        updated_at
    `;
    const result = await this.databaseService.query<{
      document_id: string;
      validation_status: string;
      observation: string | null;
      validator_id: string;
      validation_date: Date | null;
      updated_at: Date;
    }>(query, [dbStatus, observation, validatorId, documentId]);

    if (result.length === 0) return null;
    const row = result[0];
    return new DocumentValidationModel(
      row.document_id,
      row.validation_status,
      row.observation,
      row.validator_id,
      row.validation_date,
      row.updated_at,
    );
  }

  async changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void> {
    // Principio de Auditoría: SIEMPRE llamar la función de la BD, nunca UPDATE directo
    await this.databaseService.query(
      `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
      [solicitudId, newStatus, userId, comment],
    );
  }

  async getRequestIdByDocumentId(documentId: string): Promise<string | null> {
    const result = await this.databaseService.query<{
      id_solicitud: string;
    }>(
      `SELECT id_solicitud FROM acometidas.documento_adjunto WHERE id_documento = $1`,
      [documentId],
    );
    return result.length > 0 ? result[0].id_solicitud : null;
  }

  async getClientIdBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ id_cliente: string }>(
      `SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].id_cliente : null;
  }
}
