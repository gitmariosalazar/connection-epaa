export interface StateCatalogResponse {
  stateId: number;
  name: string;
  description: string;
  allowsBilling: boolean;
  requiresInspection: boolean;
  allowsReading: boolean;
}
