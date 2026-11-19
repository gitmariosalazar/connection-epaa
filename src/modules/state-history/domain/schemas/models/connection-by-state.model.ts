export class ConnectionByStateItemModel {
  constructor(
    public readonly connectionId: string,
    public readonly accountNumber: string | null,
    public readonly cadastralKey: string | null,
    public readonly contractNumber: string | null,
    public readonly sectorId: number | null,
    public readonly stateId: number,
    public readonly stateName: string,
    public readonly isActiveLegacy: boolean,
    public readonly clientName: string | null,
    public readonly clientIdentification: string | null,
    public readonly lastStateChangedAt: Date | null,
  ) {}
}
