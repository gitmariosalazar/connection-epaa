import { ObservationConnectionResponse } from '../schemas/dto/response/observation-connection.response';
import { ObservationConnectionModel } from '../schemas/models/observation-connection.model';

export interface InterfaceObservationConnectionRepository {
  createObservationConnection(
    observation: ObservationConnectionModel,
  ): Promise<ObservationConnectionResponse | null>;

  getObservationConnectionsByConnectionId(
    connectionId: string,
  ): Promise<ObservationConnectionResponse[]>;

  getObservationConnectionsByObservationId(
    observationId: number,
  ): Promise<ObservationConnectionResponse[]>;

  getAllObservationConnections(): Promise<ObservationConnectionResponse[]>;
}
