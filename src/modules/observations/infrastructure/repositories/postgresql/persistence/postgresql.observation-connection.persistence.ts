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
import { ObservationConnectionPostgreSqlAdapter } from '../adapters/observation-connection.postgresql.adapter';

@Injectable()
export class ObservationConnectionPostgreSqlPersistence implements InterfaceObservationConnectionRepository {
  // Implement repository methods here
  constructor(private readonly postgreSqlService: DatabaseServicePostgreSQL) {}

  // Implement repository methods here
  async createObservationConnection(
    observation: ObservationConnectionModel,
  ): Promise<ObservationConnectionResponse | null> {
    try {
      const insertObservationQuery: string = `
        INSERT INTO observacion (titulo_observacion, detalle_observacion) VALUES ($1,$2) returning observacion_id as
        "observation_id", titulo_observacion as "observation_title", detalle_observacion as "observation_details";
      `;
      const insertObservationParams = [
        observation.getObservation().getObservationTitle(),
        observation.getObservation().getObservationDetails(),
      ];

      const result = await this.postgreSqlService.query<ObservationSQLResult>(
        insertObservationQuery,
        insertObservationParams,
      );
      console.log(`result`, result);
      const observationId: number = result[0].observation_id;

      const insertObservationConnectionQuery: string = `
      insert into observacion_acometida(observacion_id, acometida_id)  values ($1, $2) 
      returning observacion_acometida_id as "observation_connection_id",observacion_id as "observation_id", acometida_id as "connection_id"
      `;
      const insertObservationConnectionParams = [
        observationId,
        observation.getConnectionId(),
      ];

      const resultObservationConnection =
        await this.postgreSqlService.query<ObservationConnectionSQLResult>(
          insertObservationConnectionQuery,
          insertObservationConnectionParams,
        );

      const observationConnectionId: number =
        resultObservationConnection[0].observation_connection_id;

      const selectObservationConnectionQuery: string = `
        SELECT 
          oa.observacion_acometida_id AS "observation_connection_id",
          oa.acometida_id AS "connection_id",
          o.observacion_id AS "observation_id",
          o.detalle_observacion AS "observation_details"
        FROM observacion_acometida oa
        INNER JOIN observacion o ON oa.observacion_id = o.observacion_id
        WHERE oa.observacion_acometida_id = $1;
      `;
      const selectObservationConnectionParams = [observationConnectionId];

      const resultSelect =
        await this.postgreSqlService.query<ObservationConnectionSqlResponse>(
          selectObservationConnectionQuery,
          selectObservationConnectionParams,
        );

      return ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse(
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
        WHERE oa.acometida_id = $1;
      `;
      const params = [connectionId];

      const result =
        await this.postgreSqlService.query<ObservationConnectionSqlResponse>(
          query,
          params,
        );
      return result.map(
        ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse,
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
        WHERE oa.observacion_id = $1;
      `;
      const params = [observationId];

      const result =
        await this.postgreSqlService.query<ObservationConnectionSqlResponse>(
          query,
          params,
        );
      return result.map(
        ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse,
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
        await this.postgreSqlService.query<ObservationConnectionSqlResponse>(
          query,
        );
      return result.map(
        ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse,
      );
    } catch (error) {
      throw error;
    }
  }
}
