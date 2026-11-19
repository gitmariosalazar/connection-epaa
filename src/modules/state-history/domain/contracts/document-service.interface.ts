export interface UploadEvidenceInput {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  connectionId: string;
  userId: string;
  tipoDocumento: string; // Ej: 'EVIDENCIA_SUSPENSION', 'ACTA_CORTE'
  observaciones?: string;
}

export interface UploadEvidenceOutput {
  documentId: string; // UUID único generado por el microservicio documents
  documentUrl: string; // Ruta o URL para acceder/descargar el documento
}

export interface IDocumentService {
  /**
   * Sube la evidencia al microservicio de documentos y retorna su identificador.
   */
  uploadEvidence(input: UploadEvidenceInput): Promise<UploadEvidenceOutput>;
}
