export class DocumentValidationModel {
  constructor(
    public readonly documentId: string,
    public readonly validationStatus: string, // 'APROBADO' | 'RECHAZADO' | 'PENDIENTE'
    public readonly observation: string | null,
    public readonly validatorId: string,
    public readonly validationDate: Date | null,
    public readonly updatedAt?: Date,
  ) {}
}
