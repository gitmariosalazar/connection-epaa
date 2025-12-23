import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { UpdateConnectionRequest } from '../../domain/schemas/dto/request/update.connection.request';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../../domain/schemas/dto/response/connection.response';

export interface InterfaceConnectionUseCase {
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
}
