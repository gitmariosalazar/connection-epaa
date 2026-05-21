export interface ConnectionDocumentResponse {
  documentId: string;
  requestId: string;
  documentTypeId: number;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeInBytes: number;
  hashSha256: string;
  validationStatus: string;
  observation: string;
  validatorId: string | null;
  validationDate: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
