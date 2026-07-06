export class CorrectionDocumentDto {
  documentId: string;
  originalName: string;
  mimeType: string;
  sizeInBytes: number;
  fileBase64: string;
}

export class SubmitCorrectionsRequest {
  solicitudId: string;
  userId: string;
  documents: CorrectionDocumentDto[];
}
