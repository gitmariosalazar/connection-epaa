export class RequestModel {
  constructor(
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly personType: string,
    public readonly connectionType: string,
    public readonly propertyUse: string,
    public readonly address: string,
    public readonly cadastralKey: string,
    public readonly geom: string | null,
    public readonly status: string,
    public readonly additionalInfo: Record<string, any>,
    public readonly analysticId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
