import { ObservationConnectionResponse } from '../../../../domain/schemas/dto/response/observation-connection.response';
import { ObservationConnectionSqlResponse } from '../../../interfaces/sql/observation-connection.sql.response';

export class ObservationConnectionPostgreSqlAdapter {
  static fromObservationConnectionSqlResponseToObservationConnectionResponse(
    sqlResponse: ObservationConnectionSqlResponse,
  ): ObservationConnectionResponse {
    return {
      observationConnectionId: sqlResponse.observation_connection_id,
      observationId: sqlResponse.observation_id,
      connectionId: sqlResponse.connection_id,
      observationDetails: sqlResponse.observation_details,
    };
  }
}
