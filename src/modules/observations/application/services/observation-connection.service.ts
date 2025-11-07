import { Inject, Injectable } from "@nestjs/common";
import { InterfaceObservationConnectionUseCase } from "../usecases/observation-connection.use-case.interface";
import { InterfaceObservationConnectionRepository } from "../../domain/contracts/observation-connection.interface.repository";
import { CreateObservationConnectionRequest } from "../../domain/schemas/dto/request/create.observation-connection.request";
import { ObservationConnectionResponse } from "../../domain/schemas/dto/response/observation-connection.response";
import { ObservationConnectionMapper } from "../mappers/observation-connection.mapper";
import { validateFields } from "../../../../shared/validators/fields.validators";
import { statusCode } from "../../../../settings/environments/status-code";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class ObservationConnectionService implements InterfaceObservationConnectionUseCase {
  constructor(
    @Inject('ObservationConnectionRepository')
    private readonly observationConnectionRepository: InterfaceObservationConnectionRepository,
  ) { }

  async createObservationConnection(observation: CreateObservationConnectionRequest): Promise<ObservationConnectionResponse | null> {
    try {

      const requiredFields: string[] = ['connectionId', 'observationTitle', 'observationDetails'];

      const missingFieldsMessages: string[] = validateFields(observation, requiredFields);
      if (missingFieldsMessages.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFieldsMessages
        })
      }

      const observationModel = ObservationConnectionMapper.fromCreateObservationConnectionRequestToObservationModel(observation);
      return await this.observationConnectionRepository.createObservationConnection(observationModel);
    } catch (error) {
      throw error;
    }
  }

  async getObservationConnectionsByObservationId(observationId: number): Promise<ObservationConnectionResponse[]> {
    try {

      if (!observationId || observationId <= 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid observationId provided',
        });
      }

      return await this.observationConnectionRepository.getObservationConnectionsByObservationId(observationId);
    } catch (error) {
      throw error;
    }
  }

  async getObservationConnectionsByConnectionId(connectionId: string): Promise<ObservationConnectionResponse[]> {
    try {
      if (!connectionId || connectionId.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid connectionId provided',
        });
      }

      const connections: ObservationConnectionResponse[] = await this.observationConnectionRepository.getObservationConnectionsByConnectionId(connectionId);

      if (connections.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No observation connections found for connectionId ${connectionId}`,
        });
      }
      return connections;
    } catch (error) {
      throw error;
    }
  }

  async getAllObservationConnections(): Promise<ObservationConnectionResponse[]> {
    try {
      const observationConnections = await this.observationConnectionRepository.getAllObservationConnections();

      if (!observationConnections || observationConnections.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'No observation connections found',
        });
      }

      return observationConnections;
    } catch (error) {
      throw error;
    }
  }
}