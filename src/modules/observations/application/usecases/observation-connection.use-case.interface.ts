import { CreateObservationConnectionRequest } from "../../domain/schemas/dto/request/create.observation-connection.request";
import { ObservationConnectionResponse } from "../../domain/schemas/dto/response/observation-connection.response";

export interface InterfaceObservationConnectionUseCase {
  createObservationConnection(
    observation: CreateObservationConnectionRequest
  ): Promise<ObservationConnectionResponse | null>;

  getObservationConnectionsByConnectionId(
    connectionId: string
  ): Promise<ObservationConnectionResponse[]>;

  getObservationConnectionsByObservationId(
    observationId: number
  ): Promise<ObservationConnectionResponse[]>;

  getAllObservationConnections(): Promise<ObservationConnectionResponse[]>;
}