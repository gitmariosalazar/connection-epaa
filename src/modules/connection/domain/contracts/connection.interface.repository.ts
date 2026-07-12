import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
  PropertyWithClientResponse,
} from '../schemas/dto/response/connection.response';
import {
  DashboardAdvanceResponse,
  LiveMapConnectionResponse,
} from '../schemas/dto/response/dashboard.response';
import { ConnectionModel } from '../schemas/models/connection.model';
import {
  BulkStateChangeResponse,
  ConnectionsByStateResponse,
  ConnectionStateHistoryResponse,
  ConnectionStateResponse,
  StateSummaryResponse,
} from '../schemas/dto/response/connection-state.response';
import { CustomerDashboardResponseDto } from '../schemas/dto/response/customer-dashboard.dto';

export interface InterfaceConnectionRepository {
  getCustomerDashboard(clientId: string): Promise<CustomerDashboardResponseDto | null>;
  getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse>;
  getLiveUpdateMapConnections(): Promise<LiveMapConnectionResponse[]>;
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
    cadastralKey: string,
  ): Promise<ConnectionAndPropertyResponse | null>;
  findConnectionAndPropertyByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<ConnectionAndPropertyResponse[]>;
  findConnectionWithPropertyByCadastralKey(
    cadastralKey: string,
  ): Promise<ConnectionWithPropertyResponse | null>;

  findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
    searchValue: string,
    limit: number,
    offset: number,
  ): Promise<PropertyWithClientResponse[]>;

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
    hasIncidents?: 'yes' | 'no';
    status?: string;
    sewerage?: 'yes' | 'no';
    hasCoordinates?: 'yes' | 'no';
    searchField?: string;
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
