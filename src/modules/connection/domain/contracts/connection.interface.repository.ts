import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../schemas/dto/response/connection.response';
import { DashboardAdvanceResponse } from '../schemas/dto/response/dashboard.response';
import { ConnectionModel } from '../schemas/models/connection.model';

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
}
