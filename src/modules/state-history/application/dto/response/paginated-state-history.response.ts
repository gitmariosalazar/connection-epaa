import { StateHistoryResponse } from './state-history.response';

export interface PaginatedStateHistoryResponse {
  items: StateHistoryResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConnectionByStateItemResponse {
  connectionId: string;
  accountNumber: string | null;
  cadastralKey: string | null;
  contractNumber: string | null;
  sectorId: number | null;
  stateId: number;
  stateName: string;
  isActiveLegacy: boolean;
  clientName: string | null;
  clientIdentification: string | null;
  lastStateChangedAt: string | null;
}

export interface PaginatedConnectionsByStateResponse {
  items: ConnectionByStateItemResponse[];
  total: number;
  limit: number;
  offset: number;
}
