/* eslint-disable no-useless-catch */
import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRepository } from '../../domain/contracts/connection.interface.repository';
import { InterfaceConnectionUseCase } from '../usecases/connection.use-case.interface';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
  PropertyWithClientResponse,
} from '../../domain/schemas/dto/response/connection.response';
import { DashboardAdvanceResponse } from '../../domain/schemas/dto/response/dashboard.response';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { validateFields } from '../../../../shared/validators/fields.validators';
import { ConnectionModel } from '../../domain/schemas/models/connection.model';
import { ConnectionMapper } from '../mappers/connection.mapper';
import { UpdateConnectionRequest } from '../../domain/schemas/dto/request/update.connection.request';
import {
  BulkStateChangeResponse,
  ConnectionsByStateResponse,
  ConnectionStateHistoryResponse,
  ConnectionStateResponse,
  StateSummaryResponse,
} from '../../domain/schemas/dto/response/connection-state.response';

@Injectable()
export class ConnectionService implements InterfaceConnectionUseCase {
  constructor(
    @Inject('ConnectionRepository')
    private readonly connectionRepository: InterfaceConnectionRepository,
  ) {}

  async getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse> {
    try {
      return await this.connectionRepository.getAdvanceDashboardStats();
    } catch (error) {
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Could not fetch dashboard advancement stats',
      });
    }
  }

  async verifyConnectionExists(connectionId: string): Promise<boolean> {
    return this.connectionRepository.verifyConnectionExists(connectionId);
  }

  async getConnectionById(
    connectionId: string,
  ): Promise<ConnectionResponse | null> {
    try {
      if (!connectionId || connectionId.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid connectionId provided',
        });
      }

      const verified =
        await this.connectionRepository.verifyConnectionExists(connectionId);
      if (!verified) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection with id ${connectionId} not found`,
        });
      }

      const connection =
        await this.connectionRepository.getConnectionById(connectionId);
      return connection;
    } catch (error) {
      throw error;
    }
  }

  async deleteConnection(connectionId: string): Promise<boolean> {
    try {
      const verified =
        await this.connectionRepository.verifyConnectionExists(connectionId);
      if (!verified) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection with id ${connectionId} not found`,
        });
      }

      return this.connectionRepository.deleteConnection(connectionId);
    } catch (error) {
      throw error;
    }
  }

  async findAllConnections(
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]> {
    try {
      const connections = await this.connectionRepository.findAllConnections(
        limit,
        offset,
      );

      if (!connections || connections.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'No connections found',
        });
      }

      return connections;
    } catch (error) {
      throw error;
    }
  }

  async createConnection(
    connection: CreateConnectionRequest,
  ): Promise<ConnectionResponse | null> {
    try {
      const requiredFields: string[] = [
        'clientId',
        'connectionRateId',
        'connectionRateName',
        'connectionMeterNumber',
        //'connectionSector',
        //'connectionAccount',
        //'connectionCadastralKey',
        'connectionContractNumber',
        'connectionSewerage',
        'connectionStatus',
        'connectionAddress',
        'connectionInstallationDate',
        'connectionPeopleNumber',
        'connectionZone',
        'longitude',
        'latitude',
        'connectionReference',
        'ConnectionMetaData',
        'connectionAltitude',
        'connectionPrecision',
        'connectionGeolocationDate',
        //'connectionGeometricZone',
        //'propertyCadastralKey',
        'zoneId',
      ];

      const missingFieldMessages: string[] = validateFields(
        connection,
        requiredFields,
      );

      if (missingFieldMessages.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFieldMessages,
        });
      }

      const verified = await this.connectionRepository.verifyConnectionExists(
        connection.connectionId,
      );
      if (verified === true) {
        throw new RpcException({
          statusCode: statusCode.CONFLICT,
          message: `Connection with id ${connection.connectionId} already exists!`,
        });
      }

      const connectionModel: ConnectionModel =
        ConnectionMapper.fromCreateConnectionRequestToConnectionModel(
          connection,
        );

      const newConnection =
        await this.connectionRepository.createConnection(connectionModel);

      if (!newConnection) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Error creating new connection',
        });
      }

      return newConnection;
    } catch (error) {
      throw error;
    }
  }

  async updateConnection(
    connectionId: string,
    connection: Partial<UpdateConnectionRequest>,
  ): Promise<ConnectionResponse | null> {
    try {
      if (!connectionId || connectionId.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid connectionId provided',
        });
      }

      const verified =
        await this.connectionRepository.verifyConnectionExists(connectionId);
      if (!verified) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection with id ${connectionId} not found`,
        });
      }

      const existingConnection =
        await this.connectionRepository.getConnectionById(connectionId);
      if (!existingConnection) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection with id ${connectionId} not found`,
        });
      }

      const existingConnectionModel =
        ConnectionMapper.fromResponseToModel(existingConnection);

      const connectionModel: ConnectionModel =
        ConnectionMapper.fromUpdateConnectionRequestToConnectionModel(
          connection,
          existingConnectionModel,
        );

      const updatedConnection =
        await this.connectionRepository.updateConnection(
          connectionId,
          connectionModel,
        );

      if (!updatedConnection) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Error updating connection',
        });
      }

      return updatedConnection;
    } catch (error) {
      throw error;
    }
  }

  async findConnectionAndPropertyByCadastralKey(
    propertyCadastralKey: string,
  ): Promise<ConnectionAndPropertyResponse | null> {
    try {
      if (!propertyCadastralKey || propertyCadastralKey.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid propertyCadastralKey provided',
        });
      }

      const connectionAndProperty =
        await this.connectionRepository.findConnectionAndPropertyByCadastralKey(
          propertyCadastralKey,
        );

      if (!connectionAndProperty) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection and property found with cadastral key ${propertyCadastralKey}`,
        });
      }

      return connectionAndProperty;
    } catch (error) {
      throw error;
    }
  }

  async findConnectionAndPropertyByCadastralKeyOrCardId(
    searchValue: string,
  ): Promise<ConnectionAndPropertyResponse[]> {
    try {
      if (!searchValue || searchValue.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid searchValue provided',
        });
      }

      const connectionsAndProperties =
        await this.connectionRepository.findConnectionAndPropertyByCadastralKeyOrCardId(
          searchValue,
        );

      if (!connectionsAndProperties || connectionsAndProperties.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections and properties found with search value ${searchValue}`,
        });
      }

      return connectionsAndProperties;
    } catch (error) {
      throw error;
    }
  }

  async findConnectionWithPropertyByCadastralKey(
    cadastralKey: string,
  ): Promise<ConnectionWithPropertyResponse | null> {
    try {
      if (!cadastralKey || cadastralKey.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid cadastralKey provided',
        });
      }

      const connectionWithProperty =
        await this.connectionRepository.findConnectionWithPropertyByCadastralKey(
          cadastralKey,
        );

      if (!connectionWithProperty) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection with property found with cadastral key ${cadastralKey}`,
        });
      }

      return connectionWithProperty;
    } catch (error) {
      throw error;
    }
  }

  async findAllConnectionsWithProperty(params: {
    limit: number;
    offset: number;
    query?: string;
  }): Promise<ConnectionWithoutPropertyResponse[]> {
    try {
      const connectionsWithProperty =
        await this.connectionRepository.findAllConnectionsWithProperty(params);

      if (!connectionsWithProperty || connectionsWithProperty.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'No connections with property found',
        });
      }

      return connectionsWithProperty;
    } catch (error) {
      throw error;
    }
  }

  async getConnectionsPaginated(params: {
    limit: number;
    offset: number;
    query?: string;
  }): Promise<ConnectionResponse[]> {
    try {
      const connections =
        await this.connectionRepository.getConnectionsPaginated(params);

      if (!connections || connections.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'No connections found',
        });
      }

      return connections;
    } catch (error) {
      throw error;
    }
  }

  async findConnectionsBySector(
    sector: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]> {
    try {
      if (!sector || sector.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid sector provided',
        });
      }

      const connections =
        await this.connectionRepository.findConnectionsBySector(
          sector,
          limit,
          offset,
        );

      if (!connections || connections.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections found in sector ${sector}`,
        });
      }

      return connections;
    } catch (error) {
      throw error;
    }
  }

  async findAllConnectionsByClientId(
    clientId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]> {
    try {
      if (!clientId || clientId.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid clientId provided',
        });
      }

      const connections =
        await this.connectionRepository.findAllConnectionsByClientId(
          clientId,
          limit,
          offset,
        );

      if (!connections || connections.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections found for client with id ${clientId}`,
        });
      }

      return connections;
    } catch (error) {
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────
  async changeConnectionState(
    connectionId: string,
    newStateId: number,
    userId: string,
    motivo: string,
    detallesTecnicos?: Record<string, any>,
  ): Promise<ConnectionStateResponse> {
    try {
      if (!connectionId?.trim()) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'connectionId is required',
        });
      }
      if (!newStateId || newStateId < 1) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Valid newStateId is required',
        });
      }
      if (!userId?.trim()) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'userId is required',
        });
      }
      if (!motivo?.trim()) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'motivo is required for audit trail',
        });
      }

      const exists =
        await this.connectionRepository.verifyConnectionExists(connectionId);
      if (!exists) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection ${connectionId} not found`,
        });
      }

      return this.connectionRepository.changeConnectionState(
        connectionId,
        newStateId,
        userId,
        motivo,
        detallesTecnicos,
      );
    } catch (error) {
      throw error;
    }
  }

  async getConnectionStateHistory(
    connectionId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionStateHistoryResponse[]> {
    try {
      if (!connectionId?.trim()) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'connectionId is required',
        });
      }

      const exists =
        await this.connectionRepository.verifyConnectionExists(connectionId);
      if (!exists) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection ${connectionId} not found`,
        });
      }

      const history = await this.connectionRepository.getConnectionStateHistory(
        connectionId,
        limit ?? 50,
        offset ?? 0,
      );

      return history;
    } catch (error) {
      throw error;
    }
  }

  async getConnectionsByState(
    stateId: number,
    sector?: number,
    limit?: number,
    offset?: number,
  ): Promise<ConnectionsByStateResponse[]> {
    try {
      if (!stateId || stateId < 1) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Valid stateId is required',
        });
      }

      return this.connectionRepository.getConnectionsByState(
        stateId,
        sector,
        limit ?? 100,
        offset ?? 0,
      );
    } catch (error) {
      throw error;
    }
  }

  async getStateSummaryDashboard(): Promise<StateSummaryResponse[]> {
    try {
      return this.connectionRepository.getStateSummaryDashboard();
    } catch (error) {
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Could not fetch connection state summary',
      });
    }
  }

  async bulkChangeConnectionState(
    connectionIds: string[],
    newStateId: number,
    userId: string,
    motivo: string,
  ): Promise<BulkStateChangeResponse> {
    try {
      if (!connectionIds?.length) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'At least one connectionId is required',
        });
      }
      if (!newStateId || newStateId < 1) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Valid newStateId is required',
        });
      }
      if (!userId?.trim()) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'userId is required',
        });
      }
      if (!motivo?.trim()) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'motivo is required for audit trail',
        });
      }

      return this.connectionRepository.bulkChangeConnectionState(
        connectionIds,
        newStateId,
        userId,
        motivo,
      );
    } catch (error) {
      throw error;
    }
  }

  async findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
    searchValue: string,
    limit: number,
    offset: number,
  ): Promise<PropertyWithClientResponse[]> {
    try {
      if (!searchValue || searchValue.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid searchValue provided',
        });
      }

      const propertiesWithClient =
        await this.connectionRepository.findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
          searchValue,
          limit,
          offset,
        );

      if (!propertiesWithClient || propertiesWithClient.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No properties with client found matching search value ${searchValue}`,
        });
      }

      return propertiesWithClient;
    } catch (error) {
      throw error;
    }
  }
}
