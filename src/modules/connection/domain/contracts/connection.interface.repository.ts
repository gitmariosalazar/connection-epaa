import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../schemas/dto/response/connection.response';
import { DashboardAdvanceResponse } from '../schemas/dto/response/dashboard.response';
import { ConnectionModel } from '../schemas/models/connection.model';
import {
  BulkStateChangeResponse,
  ConnectionsByStateResponse,
  ConnectionStateHistoryResponse,
  ConnectionStateResponse,
  StateSummaryResponse,
} from '../schemas/dto/response/connection-state.response';

export interface InterfaceConnectionRepository {
  getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse>;
  updateConnection(
    connectionId: string,
    connection: ConnectionModel,
  ): Promise<ConnectionResponse | null>;
  createConnection(
    connection: ConnectionModel,
  ): Promise<ConnectionResponse | null>;
  getConnectionById(connectionId: string): Promise<ConnectionResponse | null>;
  deleteConnection(connectionId: string): Promise<boolean>;
  verifyConnectionExists(connectionId: string): Promise<boolean>;
  findAllConnections(
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]>;
  findConnectionAndPropertyByCadastralKey(
    propertyCadastralKey: string,
  ): Promise<ConnectionAndPropertyResponse | null>;
  findConnectionWithPropertyByCadastralKey(
    cadastralKey: string,
  ): Promise<ConnectionWithPropertyResponse | null>;

  findConnectionsBySector(
    sector: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]>;
  findAllConnectionsByClientId(
    clientId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]>;

  findAllConnectionsWithProperty(params: {
    limit: number;
    offset: number;
    query?: string;
  }): Promise<ConnectionWithoutPropertyResponse[]>;

  getConnectionsPaginated(params: {
    limit: number;
    offset: number;
    query?: string;
  }): Promise<ConnectionResponse[]>;

  // ── State Management ──────────────────────────────────────────────────────
  changeConnectionState(
    connectionId: string,
    newStateId: number,
    userId: string,
    motivo: string,
    detallesTecnicos?: Record<string, any>,
  ): Promise<ConnectionStateResponse>;

  getConnectionStateHistory(
    connectionId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionStateHistoryResponse[]>;

  getConnectionsByState(
    stateId: number,
    sector?: number,
    limit?: number,
    offset?: number,
  ): Promise<ConnectionsByStateResponse[]>;

  getStateSummaryDashboard(): Promise<StateSummaryResponse[]>;

  bulkChangeConnectionState(
    connectionIds: string[],
    newStateId: number,
    userId: string,
    motivo: string,
  ): Promise<BulkStateChangeResponse>;
}
