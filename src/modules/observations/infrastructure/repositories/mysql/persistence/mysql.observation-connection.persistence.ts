import { Injectable } from '@nestjs/common';
import { InterfaceObservationConnectionRepository } from '../../../../domain/contracts/observation-connection.interface.repository';
import { DatabaseServicePostgreSQL } from '../../../../../../shared/connections/database/postgresql/postgresql.service';
import { ObservationConnectionResponse } from '../../../../domain/schemas/dto/response/observation-connection.response';
import { ObservationConnectionModel } from '../../../../domain/schemas/models/observation-connection.model';
import {
  ObservationConnectionSqlResponse,
  ObservationConnectionSQLResult,
  ObservationSQLResult,
} from '../../../interfaces/sql/observation-connection.sql.response';
import { ObservationConnectionSqlAdapter } from '../../../adapters/observation-connection.postgresql.adapter';
import { DatabaseServiceMySQL } from '../../../../../../shared/connections/database/mysql/mysql.service';

@Injectable()
export class ObservationConnectionMySqlPersistence
  implements InterfaceObservationConnectionRepository
{
  // Implement repository methods here
  constructor(private readonly mySqlService: DatabaseServiceMySQL) {}

  // Implement repository methods here
  async createObservationConnection(
    observation: ObservationConnectionModel,
  ): Promise<ObservationConnectionResponse | null> {
    try {
      const insertObservationQuery: string = `
        INSERT INTO observacion (titulo_observacion, detalle_observacion) VALUES (?,?);
      `;
      const insertObservationParams = [
        observation.getObservation().getObservationTitle(),
        observation.getObservation().getObservationDetails(),
      ];

      const result: any = await this.mySqlService.query(
        insertObservationQuery,
        insertObservationParams,
      );
      console.log(`result`, result);
      const observationId: number = result.insertId;

      const insertObservationConnectionQuery: string = `
      insert into observacion_acometida(observacion_id, acometida_id)  values (?, ?);
      `;
      const insertObservationConnectionParams = [
        observationId,
        observation.getConnectionId(),
      ];

      const resultObservationConnection: any =
        await this.mySqlService.query(
          insertObservationConnectionQuery,
          insertObservationConnectionParams,
        );

      const observationConnectionId: number =
        resultObservationConnection.insertId;

      const selectObservationConnectionQuery: string = `
        SELECT 
          oa.observacion_acometida_id AS "observation_connection_id",
          oa.acometida_id AS "connection_id",
          o.observacion_id AS "observation_id",
          o.detalle_observacion AS "observation_details"
        FROM observacion_acometida oa
        INNER JOIN observacion o ON oa.observacion_id = o.observacion_id
        WHERE oa.observacion_acometida_id = ?;
      `;
      const selectObservationConnectionParams = [observationConnectionId];

      const resultSelect =
        await this.mySqlService.query<ObservationConnectionSqlResponse>(
          selectObservationConnectionQuery,
          selectObservationConnectionParams,
        );

      return ObservationConnectionSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse(
        resultSelect[0],
      );
    } catch (error) {
      throw error;
    }
  }

  async getObservationConnectionsByConnectionId(
    connectionId: string,
  ): Promise<ObservationConnectionResponse[]> {
    try {
      const query: string = `
        SELECT 
          oa.observacion_acometida_id AS "observation_connection_id",
          oa.acometida_id AS "connection_id",
          o.observacion_id AS "observation_id",
          o.detalle_observacion AS "observation_details"
        FROM observacion_acometida oa
        INNER JOIN observacion o ON oa.observacion_id = o.observacion_id
        WHERE oa.acometida_id = ?;
      `;
      const params = [connectionId];

      const result =
        await this.mySqlService.query<ObservationConnectionSqlResponse>(
          query,
          params,
        );
      return result.map(
        ObservationConnectionSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse,
      );
    } catch (error) {
      throw error;
    }
  }

  async getObservationConnectionsByObservationId(
    observationId: number,
  ): Promise<ObservationConnectionResponse[]> {
    try {
      const query: string = `
        SELECT 
          oa.observacion_acometida_id AS "observation_connection_id",
          oa.acometida_id AS "connection_id",
          o.observacion_id AS "observation_id",
          o.detalle_observacion AS "observation_details"
        FROM observacion_acometida oa
        INNER JOIN observacion o ON oa.observacion_id = o.observacion_id
        WHERE oa.observacion_id = ?;
      `;
      const params = [observationId];

      const result =
        await this.mySqlService.query<ObservationConnectionSqlResponse>(
          query,
          params,
        );
      return result.map(
        ObservationConnectionSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse,
      );
    } catch (error) {
      throw error;
    }
  }

  async getAllObservationConnections(): Promise<
    ObservationConnectionResponse[]
  > {
    try {
      const query: string = `
        SELECT 
          oa.observacion_acometida_id AS "observation_connection_id",
          oa.acometida_id AS "connection_id",
          o.observacion_id AS "observation_id",
          o.detalle_observacion AS "observation_details"
        FROM observacion_acometida oa
        INNER JOIN observacion o ON oa.observacion_id = o.observacion_id;
      `;

      const result =
        await this.mySqlService.query<ObservationConnectionSqlResponse>(query);
      return result.map(
        ObservationConnectionSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse,
      );
    } catch (error) {
      throw error;
    }
  }
}
