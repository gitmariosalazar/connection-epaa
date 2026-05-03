export interface ConnectionStateHistoryResponse {
  historialId: number;
  connectionId: string;
  stateId: number;
  stateName: string;
  allowsBilling: boolean;
  allowsReading: boolean;
  changedAt: Date;
  userId: string | null;
  userEmail: string | null;
  motivo: string | null;
  active: boolean;
  technicalDetails: Record<string, any>;
}

export interface ConnectionStateResponse {
  connectionId: string;
  currentStateId: number;
  currentStateName: string;
  allowsReading: boolean;
  allowsBilling: boolean;
  changedAt: Date;
  motivo: string | null;
}

export interface ConnectionsByStateResponse {
  connectionId: string;
  sector: number;
  account: number;
  address: string;
  meterNumber: string;
  clientName: string;
  stateName: string;
  stateChangedAt: Date;
}

export interface StateSummaryResponse {
  stateId: number;
  stateName: string;
  allowsReading: boolean;
  allowsBilling: boolean;
  total: number;
  percentage: number;
}

export interface BulkStateChangeResponse {
  updatedCount: number;
  stateId: number;
  stateName: string;
  affectedConnectionIds: string[];
}
