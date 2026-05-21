export class ContractModel {
  constructor(
    public readonly contractId: string | null,
    public readonly solicitudId: string,
    public readonly contractNumber: string,
    public readonly tariffId: number | null,
    public readonly materialCost: number,
    public readonly laborCost: number,
    public readonly connectionFee: number,
    public readonly signatureStatus: string,
    public readonly signedContractUrl: string | null,
    public readonly generatorId: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
