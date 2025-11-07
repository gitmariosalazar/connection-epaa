import { ObservationConnectionResponse } from "../../../../domain/schemas/dto/response/observation-connection.response";
import { ObservationConnectionSqlResponse } from "../../../interfaces/sql/observation-connection.sql.response";

export class ObservationConnectionPostgreSqlAdapter {
  static fromObservationConnectionSqlResponseToObservationConnectionResponse(
    sqlResponse: ObservationConnectionSqlResponse
  ): ObservationConnectionResponse {
    return {
      observationConnectionId: sqlResponse.observationConnectionId,
      observationId: sqlResponse.observationId,
      connectionId: sqlResponse.connectionId,
      observationDetails: sqlResponse.observationDetails,
    };
  }
}