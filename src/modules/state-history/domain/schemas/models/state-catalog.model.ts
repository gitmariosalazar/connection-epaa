export class StateCatalogModel {
  constructor(
    public readonly stateId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly allowsBilling: boolean,
    public readonly requiresInspection: boolean,
    public readonly allowsReading: boolean,
  ) {}
}
