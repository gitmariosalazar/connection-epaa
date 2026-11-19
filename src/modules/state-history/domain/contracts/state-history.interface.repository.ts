import { StateHistoryModel } from '../schemas/models/state-history.model';
import { StateCatalogModel } from '../schemas/models/state-catalog.model';
import { StateSummaryModel } from '../schemas/models/state-summary.model';
import { ConnectionByStateItemModel } from '../schemas/models/connection-by-state.model';
import { StateHistoryOriginEnum } from '../enums/state-history.enums';

export interface StateHistoryFilterCriteria {
  connectionId?: string;
  stateId?: number;
  userId?: string;
  origin?: StateHistoryOriginEnum;
  startDate?: Date;
  endDate?: Date;
  isReversal?: boolean;
  limit?: number;
  offset?: number;
}

export interface CurrentConnectionStateInfo {
  connectionId: string;
  stateId: number;
  stateName: string;
  description: string;
  allowsBilling: boolean;
  allowsReading: boolean;
  requiresInspection: boolean;
  isActiveLegacy: boolean;
  lastChangedAt: Date | null;
  lastReason: string | null;
  lastOrigin: string | null;
}

export interface StateHistoryGeoEventItem {
  historialId: number;
  connectionId: string;
  sector: number | null;
  stateId: number;
  stateName: string;
  effectiveDate: Date;
  reason: string | null;
  supportDocument: string | null;
  geoJson: Record<string, unknown>;
}

export interface InterfaceStateHistoryRepository {
  createStateHistory(entry: StateHistoryModel): Promise<StateHistoryModel>;
  bulkCreateStateHistory(
    entries: StateHistoryModel[],
  ): Promise<StateHistoryModel[]>;
  findById(historialId: number): Promise<StateHistoryModel | null>;
  findByConnectionId(
    connectionId: string,
    limit: number,
    offset: number,
  ): Promise<StateHistoryModel[]>;
  countByConnectionId(connectionId: string): Promise<number>;
  findCurrentStateByConnectionId(
    connectionId: string,
  ): Promise<CurrentConnectionStateInfo | null>;
  revertStateHistory(
    originHistorialId: number,
    reversalEntry: StateHistoryModel,
  ): Promise<StateHistoryModel>;
  findLatestReversibleByConnectionId(
    connectionId: string,
  ): Promise<StateHistoryModel | null>;
  findGeoEvents(
    stateId?: number,
    sectorId?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StateHistoryGeoEventItem[]>;
  findConnectionsByState(
    stateId: number,
    sectorId?: number,
    limit?: number,
    offset?: number,
  ): Promise<ConnectionByStateItemModel[]>;
  countConnectionsByState(stateId: number, sectorId?: number): Promise<number>;
  getStateCatalog(): Promise<StateCatalogModel[]>;
  getStateCatalogById(stateId: number): Promise<StateCatalogModel | null>;
  getStateSummary(): Promise<StateSummaryModel[]>;
  findFiltered(
    filter: StateHistoryFilterCriteria,
  ): Promise<{ items: StateHistoryModel[]; total: number }>;
  verifyConnectionExists(connectionId: string): Promise<boolean>;
  verifyStateExists(stateId: number): Promise<boolean>;
  verifyReversalExists(originHistoryId: number): Promise<boolean>;
  findCadastralDetailsByConnectionId(
    connectionId: string,
  ): Promise<ConnectionCadastralDetails | null>;
}

export interface ConnectionCadastralDetails {
  connectionId: string;
  sector: number;
  account: number;
  cadastralKey: string;
}

// Dentro de InterfaceStateHistoryRepository:
