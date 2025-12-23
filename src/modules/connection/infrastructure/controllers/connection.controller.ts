import { ConnectionService } from '../../application/services/connection.service';
import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { UpdateConnectionRequest } from '../../domain/schemas/dto/request/update.connection.request';

@Controller('connections')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

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

  @Get('find-connection-by-property-cadastral-key/:propertyCadastralKey')
  @MessagePattern('connections.find-connection-by-property-cadastral-key')
  async getConnectionByPropertyCadastralKey(
    @Payload() propertyCadastralKey: string,
  ) {
    return this.connectionService.findConnectionAndPropertyByCadastralKey(
      propertyCadastralKey,
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
    },
  ) {
    return this.connectionService.getConnectionsPaginated(params);
  }
}
