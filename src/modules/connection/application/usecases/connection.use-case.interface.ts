import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { UpdateConnectionRequest } from '../../domain/schemas/dto/request/update.connection.request';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../../domain/schemas/dto/response/connection.response';
import { DashboardAdvanceResponse } from '../../domain/schemas/dto/response/dashboard.response';
import {
  BulkStateChangeResponse,
  ConnectionsByStateResponse,
  ConnectionStateHistoryResponse,
  ConnectionStateResponse,
  StateSummaryResponse,
} from '../../domain/schemas/dto/response/connection-state.response';

export interface InterfaceConnectionUseCase {
  getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse>;

  updateConnection(
    connectionId: string,
    connection: Partial<UpdateConnectionRequest>,
  ): Promise<ConnectionResponse | null>;
  createConnection(
    connection: CreateConnectionRequest,
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
