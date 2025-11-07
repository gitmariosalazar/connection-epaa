import { CreateObservationConnectionRequest } from "../../domain/schemas/dto/request/create.observation-connection.request";
import { ObservationConnectionModel } from "../../domain/schemas/models/observation-connection.model";
import { ObservationModel } from "../../domain/schemas/models/observation.model";

export class ObservationConnectionMapper {
  static fromCreateObservationConnectionRequestToObservationModel(
    request: CreateObservationConnectionRequest,
  ): ObservationConnectionModel {
    const observationModel = new ObservationConnectionModel(
      0,
      request.connectionId,
      new ObservationModel(0, request.observationTitle, request.observationDetails),
    );
    return observationModel;
  }
}