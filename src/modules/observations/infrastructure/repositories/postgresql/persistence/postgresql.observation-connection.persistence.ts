import { Injectable } from "@nestjs/common";
import { InterfaceObservationConnectionRepository } from "../../../../domain/contracts/observation-connection.interface.repository";
import { DatabaseServicePostgreSQL } from "../../../../../../shared/connections/database/postgresql/postgresql.service";
import { ObservationConnectionResponse } from "../../../../domain/schemas/dto/response/observation-connection.response";
import { ObservationConnectionModel } from "../../../../domain/schemas/models/observation-connection.model";
import { ObservationConnectionSqlResponse, ObservationConnectionSQLResult, ObservationSQLResult } from "../../../interfaces/sql/observation-connection.sql.response";
import { ObservationConnectionPostgreSqlAdapter } from "../adapters/observation-connection.postgresql.adapter";


@Injectable()
export class ObservationConnectionPostgreSqlPersistence implements InterfaceObservationConnectionRepository {
  // Implement repository methods here
  constructor(
    private readonly postgreSqlService: DatabaseServicePostgreSQL
  ) { }

  // Implement repository methods here
  async createObservationConnection(observation: ObservationConnectionModel): Promise<ObservationConnectionResponse | null> {
    try {
      const insertObservationQuery: string = `
        INSERT INTO observacion (tituloobservacion, detalleobservacion) VALUES ($1,$2) returning observacionid as
        "observationId", tituloobservacion as "observationTitle", detalleobservacion as "observationDetails";
      `;
      const insertObservationParams = [observation.getObservation().getObservationTitle(), observation.getObservation().getObservationDetails()];

      const result = await this.postgreSqlService.query<ObservationSQLResult>(insertObservationQuery, insertObservationParams);
      console.log(`result`, result);
      const observationId: number = result[0].observationId;

      const insertObservationConnectionQuery: string = `
      insert into observacionacometida(observacionid, acometidaid)  values ($1, $2) 
      returning observacionacometidaid as "observationConnectionId",observacionid as "observationId", acometidaid as "connectionId"
      `;
      const insertObservationConnectionParams = [observationId, observation.getConnectionId()];

      const resultObservationConnection = await this.postgreSqlService.query<ObservationConnectionSQLResult>(insertObservationConnectionQuery, insertObservationConnectionParams);

      const observationConnectionId: number = resultObservationConnection[0].observationConnectionId;

      const selectObservationConnectionQuery: string = `
        SELECT 
          oa.observacionacometidaid AS "observationConnectionId",
          oa.acometidaid AS "connectionId",
          o.observacionid AS "observationId",
          o.detalleobservacion AS "observationDetails"
        FROM observacionacometida oa
        INNER JOIN observacion o ON oa.observacionid = o.observacionid
        WHERE oa.observacionacometidaid = $1;
      `;
      const selectObservationConnectionParams = [observationConnectionId];

      const resultSelect = await this.postgreSqlService.query<ObservationConnectionSqlResponse>(selectObservationConnectionQuery, selectObservationConnectionParams);

      return ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse(resultSelect[0]);

    } catch (error) {
      throw error;
    }
  }

  async getObservationConnectionsByConnectionId(connectionId: string): Promise<ObservationConnectionResponse[]> {
    try {
      const query: string = `
        SELECT 
          oa.observacionacometidaid AS "observationConnectionId",
          oa.acometidaid AS "connectionId",
          o.observacionid AS "observationId",
          o.detalleobservacion AS "observationDetails"
        FROM observacionacometida oa
        INNER JOIN observacion o ON oa.observacionid = o.observacionid
        WHERE oa.acometidaid = $1;
      `;
      const params = [connectionId];

      const result = await this.postgreSqlService.query<ObservationConnectionSqlResponse>(query, params);
      return result.map(ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse);
    } catch (error) {
      throw error;
    }
  }

  async getObservationConnectionsByObservationId(observationId: number): Promise<ObservationConnectionResponse[]> {
    try {
      const query: string = `
        SELECT 
          oa.observacionacometidaid AS "observationConnectionId",
          oa.acometidaid AS "connectionId",
          o.observacionid AS "observationId",
          o.detalleobservacion AS "observationDetails"
        FROM observacionacometida oa
        INNER JOIN observacion o ON oa.observacionid = o.observacionid
        WHERE oa.observacionid = $1;
      `;
      const params = [observationId];

      const result = await this.postgreSqlService.query<ObservationConnectionSqlResponse>(query, params);
      return result.map(ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse);
    } catch (error) {
      throw error;
    }
  }

  async getAllObservationConnections(): Promise<ObservationConnectionResponse[]> {
    try {
      const query: string = `
        SELECT 
          oa.observacionacometidaid AS "observationConnectionId",
          oa.acometidaid AS "connectionId",
          o.observacionid AS "observationId",
          o.detalleobservacion AS "observationDetails"
        FROM observacionacometida oa
        INNER JOIN observacion o ON oa.observacionid = o.observacionid;
      `;

      const result = await this.postgreSqlService.query<ObservationConnectionSqlResponse>(query);
      return result.map(ObservationConnectionPostgreSqlAdapter.fromObservationConnectionSqlResponseToObservationConnectionResponse);
    } catch (error) {
      throw error;
    }
  }
}