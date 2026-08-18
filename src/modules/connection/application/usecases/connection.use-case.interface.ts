import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { UpdateConnectionRequest } from '../../domain/schemas/dto/request/update.connection.request';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
  PropertyWithClientResponse,
} from '../../domain/schemas/dto/response/connection.response';
import {
  DashboardAdvanceResponse,
  LiveMapConnectionResponse,
} from '../../domain/schemas/dto/response/dashboard.response';
import {
  BulkStateChangeResponse,
  ConnectionsByStateResponse,
  ConnectionStateHistoryResponse,
  ConnectionStateResponse,
  StateSummaryResponse,
} from '../../domain/schemas/dto/response/connection-state.response';
import { CustomerDashboardResponseDto } from '../../domain/schemas/dto/response/customer-dashboard.dto';
import {
  ClientDashboardResponse,
  ConnectionDashboardResponse,
} from '../../domain/schemas/dto/response/view-dashboard.response';
import {
  MeterChangeDetail,
  MeterChangePhotoInput,
} from '../../domain/schemas/dto/request/change-meter.connection.request';
import { MeterChangeResponse } from '../../domain/schemas/dto/response/meter-change.response';

export interface InterfaceConnectionUseCase {
  getCustomerDashboard(
    clientId: string,
  ): Promise<CustomerDashboardResponseDto | null>;
  getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse>;
  getLiveUpdateMapConnections(): Promise<LiveMapConnectionResponse[]>;

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
  findConnectionAndPropertyByCadastralKeyOrCardId(
    searchValue: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionAndPropertyResponse[]>;
  findConnectionWithPropertyByCadastralKey(
    cadastralKey: string,
  ): Promise<ConnectionWithPropertyResponse | null>;
  findAllConnectionsWithProperty(params: {
    limit: number;
    offset: number;
    query?: string;
  }): Promise<ConnectionWithoutPropertyResponse[]>;

  findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
    searchValue: string,
    limit: number,
    offset: number,
  ): Promise<PropertyWithClientResponse[]>;

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
  getDashboardGlobalClientId(
    clientId: string,
  ): Promise<ClientDashboardResponse | null>;

  getDashboardConnectionsByClientId(
    clientId: string,
  ): Promise<ConnectionDashboardResponse[]>;

  // ── Meter Change ──────────────────────────────────────────────────────
  changeMeter(
    connectionId: string,
    changeDetail: MeterChangeDetail,
    images: MeterChangePhotoInput[],
  ): Promise<MeterChangeResponse>;
}
