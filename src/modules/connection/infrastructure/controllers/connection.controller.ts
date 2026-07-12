import { ConnectionService } from '../../application/services/connection.service';
import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { UpdateConnectionRequest } from '../../domain/schemas/dto/request/update.connection.request';

@Controller('connections')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Get('get-customer-dashboard/:clientId')
  @MessagePattern('connections.get-customer-dashboard')
  async getCustomerDashboard(@Payload() clientId: string) {
    return this.connectionService.getCustomerDashboard(clientId);
  }

  @Get('dashboard/advancement-stats')
  @MessagePattern('connections.get-advance-dashboard-stats')
  async getAdvanceDashboardStats() {
    return this.connectionService.getAdvanceDashboardStats();
  }

  @Get('live-update-map-connections')
  @MessagePattern('connections.get-live-update-map-connections')
  async getLiveUpdateMapConnections() {
    return this.connectionService.getLiveUpdateMapConnections();
  }

  // Implementation of controller methods
  @Post('create-connection')
  @MessagePattern('connections.create-connection')
  async createConnection(@Payload() connection: CreateConnectionRequest) {
    return this.connectionService.createConnection(connection);
  }

  @Put('update-connection/:connectionId')
  @MessagePattern('connections.update-connection')
  async updateConnection(
    @Payload()
    data: {
      connectionId: string;
      connection: UpdateConnectionRequest;
    },
  ) {
    return this.connectionService.updateConnection(
      data.connectionId,
      data.connection,
    );
  }

  @Get('get-connection/:connectionId')
  @MessagePattern('connections.get-connection-by-id')
  async getConnectionById(@Payload() connectionId: string) {
    return this.connectionService.getConnectionById(connectionId);
  }

  @Get('get-all-connections')
  @MessagePattern('connections.get-all-connections')
  async getAllConnections(
    @Payload() data: { limit?: number; offset?: number },
  ) {
    const limit = data?.limit ?? 100;
    const offset = data?.offset ?? 0;
    return await this.connectionService.findAllConnections(limit, offset);
  }

  @Get('find-connections-by-sector/:sector')
  @MessagePattern('connections.find-connections-by-sector')
  async findConnectionsBySector(
    @Payload() data: { sector: string; limit?: number; offset?: number },
  ) {
    const sector = data.sector;
    const limit = data?.limit ?? 100;
    const offset = data?.offset ?? 0;
    return await this.connectionService.findConnectionsBySector(
      sector,
      limit,
      offset,
    );
  }

  @Get('find-connections-by-client-id/:clientId')
  @MessagePattern('connections.find-connections-by-client-id')
  async findConnectionsByClientId(
    @Payload() data: { clientId: string; limit?: number; offset?: number },
  ) {
    const clientId = data.clientId;
    const limit = data?.limit ?? 100;
    const offset = data?.offset ?? 0;
    return await this.connectionService.findAllConnectionsByClientId(
      clientId,
      limit,
      offset,
    );
  }

  @Delete('delete-connection/:connectionId')
  @MessagePattern('connections.delete-connection')
  async deleteConnection(@Payload() connectionId: string) {
    return this.connectionService.deleteConnection(connectionId);
  }

  @Get('verify-connection-exists/:connectionId')
  @MessagePattern('connections.verify-connection-exists')
  async verifyConnectionExists(@Payload() connectionId: string) {
    return this.connectionService.verifyConnectionExists(connectionId);
  }

  @Get('find-connection-by-property-cadastral-key/:cadastralKey')
  @MessagePattern('connections.find-connection-by-property-cadastral-key')
  async getConnectionByPropertyCadastralKey(@Payload() cadastralKey: string) {
    return this.connectionService.findConnectionAndPropertyByCadastralKey(
      cadastralKey,
    );
  }

  @Get('find-connection-by-cadastral-key-or-card-id/:searchValue')
  @MessagePattern('connections.find-connection-by-cadastral-key-or-card-id')
  async getConnectionByCadastralKeyOrCardId(@Payload() searchValue: string) {
    return this.connectionService.findConnectionAndPropertyByCadastralKeyOrCardId(
      searchValue,
    );
  }

  @Get('find-connection-with-property-by-cadastral-key/:cadastralKey')
  @MessagePattern('connections.find-connection-with-property-by-cadastral-key')
  async getConnectionWithPropertyByCadastralKey(
    @Payload() cadastralKey: string,
  ) {
    return this.connectionService.findConnectionWithPropertyByCadastralKey(
      cadastralKey,
    );
  }

  @Get('get-all-connections-with-property')
  @MessagePattern('connections.get-all-connections-with-property')
  async getAllConnectionsWithProperty(
    @Payload() params: { limit: number; offset: number; query?: string },
  ) {
    return await this.connectionService.findAllConnectionsWithProperty(params);
  }

  @Get('get-connections-paginated')
  @MessagePattern('connections.get-connections-paginated')
  async getConnectionsPaginated(
    @Payload()
    params: {
      limit: number;
      offset: number;
      query?: string;
      hasIncidents?: 'yes' | 'no';
      status?: string;
      sewerage?: 'yes' | 'no';
      hasCoordinates?: 'yes' | 'no';
      searchField?: string;
    },
  ) {
    return this.connectionService.getConnectionsPaginated(params);
  }

  // ── State Management ────────────────────────────────────────────────────────

  @Post('change-connection-state')
  @MessagePattern('connections.change-connection-state')
  async changeConnectionState(
    @Payload()
    data: {
      connectionId: string;
      newStateId: number;
      userId: string;
      motivo: string;
      detallesTecnicos?: Record<string, any>;
    },
  ) {
    return this.connectionService.changeConnectionState(
      data.connectionId,
      data.newStateId,
      data.userId,
      data.motivo,
      data.detallesTecnicos,
    );
  }

  @Get('get-connection-state-history')
  @MessagePattern('connections.get-connection-state-history')
  async getConnectionStateHistory(
    @Payload()
    data: {
      connectionId: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.connectionService.getConnectionStateHistory(
      data.connectionId,
      data.limit ?? 50,
      data.offset ?? 0,
    );
  }

  @Get('get-connections-by-state')
  @MessagePattern('connections.get-connections-by-state')
  async getConnectionsByState(
    @Payload()
    data: {
      stateId: number;
      sector?: number;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.connectionService.getConnectionsByState(
      data.stateId,
      data.sector,
      data.limit ?? 100,
      data.offset ?? 0,
    );
  }

  @Get('get-state-summary-dashboard')
  @MessagePattern('connections.get-state-summary-dashboard')
  async getStateSummaryDashboard() {
    return this.connectionService.getStateSummaryDashboard();
  }

  @Post('bulk-change-connection-state')
  @MessagePattern('connections.bulk-change-connection-state')
  async bulkChangeConnectionState(
    @Payload()
    data: {
      connectionIds: string[];
      newStateId: number;
      userId: string;
      motivo: string;
    },
  ) {
    return this.connectionService.bulkChangeConnectionState(
      data.connectionIds,
      data.newStateId,
      data.userId,
      data.motivo,
    );
  }

  @Get('find-property-with-client-by-cadastral-key-or-card-id-or-like-name')
  @MessagePattern(
    'connections.find-property-with-client-by-cadastral-key-or-card-id-or-like-name',
  )
  async findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
    @Payload()
    data: {
      searchValue: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.connectionService.findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
      data.searchValue,
      data.limit ?? 50,
      data.offset ?? 0,
    );
  }
}
