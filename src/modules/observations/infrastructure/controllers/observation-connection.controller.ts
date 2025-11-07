
import { Controller, Get, Post } from "@nestjs/common";
import { Payload } from "@nestjs/microservices/decorators/payload.decorator";
import { MessagePattern } from "@nestjs/microservices";
import { ObservationConnectionService } from "../../application/services/observation-connection.service";
import { CreateObservationConnectionRequest } from "../../domain/schemas/dto/request/create.observation-connection.request";

@Controller('observation-connection')
export class ObservationConnectionController {
  constructor(
    private readonly observationConnectionService: ObservationConnectionService
  ) { }

  @Post('create-observation-connection')
  @MessagePattern('observation-connection.create-observation-connection')
  async createObservationConnection(@Payload() observation: CreateObservationConnectionRequest) {
    return this.observationConnectionService.createObservationConnection(observation);
  }

  @Get('get-observation-connections-by-observation-id')
  @MessagePattern('observation-connection.get-observation-connections-by-observation-id')
  async getObservationConnectionsByObservationId(@Payload() data: { observationId: number }) {
    return this.observationConnectionService.getObservationConnectionsByObservationId(data.observationId);
  }

  @Get('get-observation-connections-by-connection-id')
  @MessagePattern('observation-connection.get-observation-connections-by-connection-id')
  async getObservationConnectionsByConnectionId(@Payload() data: { connectionId: string }) {
    return this.observationConnectionService.getObservationConnectionsByConnectionId(data.connectionId);
  }

  @Get('get-all-observation-connections')
  @MessagePattern('observation-connection.get-all-observation-connections')
  async getAllObservationConnections() {
    return this.observationConnectionService.getAllObservationConnections();
  }

}