export class UpdateConnectionDocumentRequest {
  constructor(
    public readonly requestId: string,
    public readonly documentTypeId: number,
    public readonly fileUrl: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly sizeInBytes: number,
    public readonly hashSha256: string,
    public readonly validationStatus: string,
    public readonly observation: string,
    public readonly validatorId: string,
    public readonly fileBase64?: string,
  ) {}
}
