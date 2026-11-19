export class StateSummaryModel {
  constructor(
    public readonly stateId: number,
    public readonly stateName: string,
    public readonly description: string,
    public readonly totalConnections: number,
    public readonly percentage: number,
    public readonly allowsBilling: boolean,
    public readonly allowsReading: boolean,
    public readonly requiresInspection: boolean,
  ) {}
}
