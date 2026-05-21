import { DocumentValidationModel } from '../schemas/models/DocumentValidationModel';

export interface InterfaceDocumentValidationRepository {
  /** Valida un documento individual y devuelve el id_solicitud al que pertenece */
  validateDocument(
    documentId: string,
    validationStatus: string,
    observation: string | null,
    validatorId: string,
  ): Promise<DocumentValidationModel | null>;

  /** Cambia el estado de la solicitud llamando a fn_cambiar_estado_solicitud */
  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;

  /** Devuelve el id_solicitud de un documento dado su id */
  getRequestIdByDocumentId(documentId: string): Promise<string | null>;

  /** Devuelve el usuario_id del cliente dueño de la solicitud */
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
}
