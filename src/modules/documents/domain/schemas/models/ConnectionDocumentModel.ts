export class ConnectionDocumentModel {
  constructor(
    public readonly documentId: string,
    public readonly requestId: string,
    public readonly documentTypeId: number,
    public readonly fileUrl: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly sizeInBytes: number,
    public readonly hashSha256: string,
    public readonly validationStatus: string,
    public readonly observation: string,
    public readonly validatorId: string | null,
    public readonly validationDate: Date | null,
    public readonly isDeleted: boolean,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
