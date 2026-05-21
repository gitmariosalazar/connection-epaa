export class ValidateDocumentsRequest {
  /** Lista de decisiones por documento */
  decisions: Array<{
    documentId: string;
    validationStatus: 'APROBADO' | 'RECHAZADO';
    observation?: string;
  }>;
  /** UUID del analista que valida */
  validatorId: string;
}
