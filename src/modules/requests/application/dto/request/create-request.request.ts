export class CreateRequestRequest {
  constructor(
    public readonly clientId: string,
    public readonly personType: string,
    public readonly connectionType: string,
    public readonly propertyUse: string,
    public readonly address: string,
    public readonly cadastralKey: string,
    public readonly geom: string | null,
    public readonly additionalInfo: Record<string, any>,
  ) {}
}
