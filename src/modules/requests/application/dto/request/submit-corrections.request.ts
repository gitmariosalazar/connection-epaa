export class CorrectionDocumentDto {
  documentId: string;
  originalName: string;
  mimeType: string;
  sizeInBytes: number;
  /** Referencia a un archivo ya guardado en disco (preferido: evita mandar el archivo por Kafka). */
  fileUrl?: string;
  hashSha256?: string;
  /** Alternativa legacy: archivo completo codificado en base64. */
  fileBase64?: string;
}

export class SubmitCorrectionsRequest {
  solicitudId: string;
  userId: string;
  documents: CorrectionDocumentDto[];
}
