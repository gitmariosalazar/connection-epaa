import { Injectable } from '@nestjs/common';
import { DatabaseServicePostgreSQL } from '../../../../../../shared/connections/database/postgresql/postgresql.service';
import { InterfaceConnectionRepository } from '../../../../domain/contracts/connection.interface.repository';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithPropertyResponse,
} from '../../../../domain/schemas/dto/response/connection.response';
import { ConnectionPostgreSqlAdapter } from '../adapters/postgresql.connection.adapter';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { ConnectionModel } from '../../../../domain/schemas/models/connection.model';
import { Exists } from '../../../../../../shared/interfaces/verify-exists';
import { ConnectionWithPropertySqlResponse } from '../../../interfaces/sql/connection.sql.response';

@Injectable()
export class PostgresqlConnectionPersistence
  implements InterfaceConnectionRepository {
  constructor(private readonly postgresqlService: DatabaseServicePostgreSQL) { }

  // Implementation of InterfaceConnectionRepository methods
  async verifyConnectionExists(connectionId: string): Promise<boolean> {
    try {
      const query: string = `SELECT EXISTS (SELECT 1 FROM acometida WHERE acometidaid = $1)`;
      const params: string[] = [connectionId];
      const result = await this.postgresqlService.query<Exists>(query, params);
      return result[0].exists;
    } catch (error) {
      throw error;
    }
  }

  async getConnectionById(
    connectionId: string,
  ): Promise<ConnectionResponse | null> {
    try {
      const query: string = `
        SELECT
            a.acometidaid as "connectionId",
            a.clienteid as "clientId",
            a.tarifaid as "connectionRateId",
            t.nombre as "connectionRateName",
            a.numeromedidor as "connectionMeterNumber",
            a.sector as "connectionSector",
            a.cuenta as "connectionAccount",
            a.clavecatastral as "connectionCadastralKey",
            a.numerocontrato as "connectionContractNumber",
            a.alcantarillado as "connectionSewerage",
            a.estado as "connectionStatus",
            a.direccion as "connectionAddress",
            a.fechainstalacion as "connectionInstallationDate",
            a.numeropersonas as "connectionPeopleNumbers",
            a.zona as "connectionZone",
            a.coordenadas as "connectionCoordinates",
            a.referencia as "connectionReference",
            a.metadata as "connectionMetadata",
            a.altitud as "connectionAltitude",
            a.precision as "connectionPrecision",
            a.fechageolocalizacion as "connectionGeolocationDate",
            a.zona_geometrica as "connectionGeometricZone",
            a.predioClaveCatastral as "propertyCadastralKey",
            a.zona_id as "zoneId"
        FROM acometida a INNER JOIN cliente c ON c.clienteid = a.clienteid
        INNER JOIN tarifa t ON t.tarifaid = a.tarifaid
        WHERE a.acometidaid = $1;
      `;
      const params: string[] = [connectionId];
      const result = await this.postgresqlService.query<ConnectionResponse>(
        query,
        params,
      );

      const response: ConnectionResponse[] = result.map((connection) =>
        ConnectionPostgreSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
          connection,
        ),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection with ID ${connectionId} not found.`,
        });
      }

      return response[0];
    } catch (error) {
      throw error;
    }
  }

  async findAllConnections(
    limit: number,
    offset: number,
  ): Promise<ConnectionResponse[]> {
    try {
      const query: string = `
        SELECT
            a.acometidaid as "connectionId",
            a.clienteid as "clientId",
            a.tarifaid as "connectionRateId",
            t.nombre as "connectionRateName",
            a.numeromedidor as "connectionMeterNumber",
            a.sector as "connectionSector",
            a.cuenta as "connectionAccount",
            a.clavecatastral as "connectionCadastralKey",
            a.numerocontrato as "connectionContractNumber",
            a.alcantarillado as "connectionSewerage",
            a.estado as "connectionStatus",
            a.direccion as "connectionAddress",
            a.fechainstalacion as "connectionInstallationDate",
            a.numeropersonas as "connectionPeopleNumbers",
            a.zona as "connectionZone",
            a.coordenadas as "connectionCoordinates",
            a.referencia as "connectionReference",
            a.metadata as "connectionMetadata",
            a.altitud as "connectionAltitude",
            a.precision as "connectionPrecision",
            a.fechageolocalizacion as "connectionGeolocationDate",
            a.zona_geometrica as "connectionGeometricZone",
            a.predioClaveCatastral as "propertyCadastralKey",
            a.zona_id as "zoneId"
        FROM acometida a
        INNER JOIN cliente c ON c.clienteid = a.clienteid
        INNER JOIN tarifa t ON t.tarifaid = a.tarifaid
        ORDER BY a.acometidaid
        LIMIT $1 OFFSET $2;
      `;
      const params: number[] = [limit, offset];
      const result = await this.postgresqlService.query<ConnectionResponse>(
        query,
        params,
      );

      const response: ConnectionResponse[] = result.map((connection) =>
        ConnectionPostgreSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
          connection,
        ),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections found.`,
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteConnection(connectionId: string): Promise<boolean> {
    try {
      const query: string = `
        DELETE FROM acometida WHERE acometidaid = $1;
      `;
      const params: string[] = [connectionId];
      const result = await this.postgresqlService.query(query, params);

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async createConnection(
    connection: ConnectionModel,
  ): Promise<ConnectionResponse | null> {
    try {
      console.log(`Connection Model`, connection);

      const query: string = `
        INSERT INTO acometida (
          acometidaid,
          clienteid,
          tarifaid,
          numeromedidor,
          sector,
          cuenta,
          clavecatastral,
          numerocontrato,
          alcantarillado,
          estado,
          direccion,
          fechainstalacion,
          numeropersonas,
          zona,
          coordenadas,
          referencia,
          metadata,
          altitud,
          precision,
          fechageolocalizacion,
          predioClaveCatastral,
          zona_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING
          acometidaid as "connectionId",
          clienteid as "clientId",
          tarifaid as "connectionRateId",
          numeromedidor as "connectionMeterNumber",
          sector as "connectionSector",
          cuenta as "connectionAccount",
          clavecatastral as "connectionCadastralKey",
          numerocontrato as "connectionContractNumber",
          alcantarillado as "connectionSewerage",
          estado as "connectionStatus",
          direccion as "connectionAddress",
          fechainstalacion as "connectionInstallationDate",
          numeropersonas as "connectionPeopleNumbers",
          zona as "connectionZone",
          coordenadas as "connectionCoordinates",
          referencia as "connectionReference",
          metadata as "connectionMetadata",
          altitud as "connectionAltitude",
          precision as "connectionPrecision",
          fechageolocalizacion as "connectionGeolocationDate",
          zona_geometrica as "connectionGeometricZone",
          predioClaveCatastral as "propertyCadastralKey",
          zona_id as "zoneId";
      `;
      const params: any[] = [
        connection.getConnectionId(),
        connection.getClientId(),
        connection.getConnectionRateId(),
        connection.getConnectionMeterNumber(),
        connection.getConnectionSector(),
        connection.getConnectionAccount(),
        connection.getConnectionCadastralKey(),
        connection.getConnectionContractNumber(),
        connection.getConnectionSewerage(),
        connection.getConnectionStatus(),
        connection.getConnectionAddress(),
        connection.getConnectionInstallationDate(),
        connection.getConnectionPeopleNumber(),
        connection.getConnectionZone(),
        connection.getConnectionCoordinates(),
        connection.getConnectionReference(),
        connection.getConnectionMetaData(),
        connection.getConnectionAltitude(),
        connection.getConnectionPrecision(),
        connection.getConnectionGeolocationDate(),
        connection.getPropertyCadastralKey(),
        connection.getZoneId(),
      ];

      const result = await this.postgresqlService.query<ConnectionResponse>(
        query,
        params,
      );
      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: `Failed to create connection.`,
        });
      }
      return ConnectionPostgreSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
        result[0],
      );
    } catch (error) {
      throw error;
    }
  }

  async updateConnection(
    connectionId: string,
    connection: ConnectionModel,
  ): Promise<ConnectionResponse | null> {
    try {
      console.log(`Connection Model: `, connection);
      const query: string = `
        UPDATE acometida SET
          clienteid = COALESCE($2, clienteid),
          tarifaid = COALESCE($3, tarifaid),
          numeromedidor = COALESCE($4, numeromedidor),
          sector = COALESCE($5, sector),
          cuenta = COALESCE($6, cuenta),
          clavecatastral = COALESCE($7, clavecatastral),
          numerocontrato = COALESCE($8, numerocontrato),
          alcantarillado = COALESCE($9, alcantarillado),
          estado = COALESCE($10, estado),
          direccion = COALESCE($11, direccion),
          fechainstalacion = COALESCE($12, fechainstalacion),
          numeropersonas = COALESCE($13, numeropersonas),
          zona = COALESCE($14, zona),
          coordenadas = COALESCE($15, coordenadas),
          referencia = COALESCE($16, referencia),
          metadata = COALESCE($17, metadata),
          altitud = COALESCE($18, altitud),
          precision = COALESCE($19, precision),
          fechageolocalizacion = COALESCE($20, fechageolocalizacion),
          predioClaveCatastral = COALESCE($21, predioClaveCatastral),
          zona_id = COALESCE($22, zona_id)
        WHERE acometidaid = $1
        RETURNING
          acometidaid as "connectionId",
          clienteid as "clientId",
          tarifaid as "connectionRateId",
          numeromedidor as "connectionMeterNumber",
          sector as "connectionSector",
          cuenta as "connectionAccount",
          clavecatastral as "connectionCadastralKey",
          numerocontrato as "connectionContractNumber",
          alcantarillado as "connectionSewerage",
          estado as "connectionStatus",
          direccion as "connectionAddress",
          fechainstalacion as "connectionInstallationDate",
          numeropersonas as "connectionPeopleNumbers",
          zona as "connectionZone",
          coordenadas as "connectionCoordinates",
          referencia as "connectionReference",
          metadata as "connectionMetadata",
          altitud as "connectionAltitude",
          precision as "connectionPrecision",
          fechageolocalizacion as "connectionGeolocationDate",
          zona_geometrica as "connectionGeometricZone",
          predioClaveCatastral as "propertyCadastralKey",
          zona_id as "zoneId";
      `;
      const params: any[] = [
        connectionId,
        connection.getClientId(),
        connection.getConnectionRateId(),
        connection.getConnectionMeterNumber(),
        connection.getConnectionSector(),
        connection.getConnectionAccount(),
        connection.getConnectionCadastralKey(),
        connection.getConnectionContractNumber(),
        connection.getConnectionSewerage(),
        connection.getConnectionStatus(),
        connection.getConnectionAddress(),
        connection.getConnectionInstallationDate(),
        connection.getConnectionPeopleNumber(),
        connection.getConnectionZone(),
        connection.getConnectionCoordinates(),
        connection.getConnectionReference(),
        connection.getConnectionMetaData(),
        connection.getConnectionAltitude(),
        connection.getConnectionPrecision(),
        connection.getConnectionGeolocationDate(),
        connection.getPropertyCadastralKey(),
        connection.getZoneId(),
      ];

      const result = await this.postgresqlService.query<ConnectionResponse>(
        query,
        params,
      );
      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: `Failed to update connection with ID ${connectionId}.`,
        });
      }
      return ConnectionPostgreSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
        result[0],
      );
    } catch (error) {
      throw error;
    }
  }

  async findConnectionAndPropertyByCadastralKey(
    propertyCadastralKey: string,
  ): Promise<ConnectionAndPropertyResponse | null> {
    try {
      const query: string = `
SELECT
    -- Connection Data
    a.acometidaid                AS "connectionId",
    a.clienteid                  AS "clientId",
    a.tarifaid                   AS "connectionRateId",
    t.nombre                     AS "connectionRateName",
    a.numeromedidor              AS "connectionMeterNumber",
    a.sector                     AS "connectionSector",
    a.cuenta                     AS "connectionAccount",
    a.clavecatastral             AS "connectionCadastralKey",
    a.numerocontrato             AS "connectionContractNumber",
    a.alcantarillado             AS "connectionSewerage",
    a.estado                     AS "connectionStatus",
    a.direccion                  AS "connectionAddress",
    a.fechainstalacion           AS "connectionInstallationDate",
    a.numeropersonas             AS "connectionPeopleNumber",
    a.zona                       AS "connectionZone",
    a.coordenadas                AS "connectionCoordinates",
    a.referencia                 AS "connectionReference",
    a.metadata                   AS "connectionMetadata",
    a.altitud                    AS "connectionAltitude",
    a.precision                  AS "connectionPrecision",
    a.fechageolocalizacion       AS "connectionGeolocationDate",
    a.zona_geometrica            AS "connectionGeometricZone",
    a.predioclavecatastral       AS "propertyCadastralKey",
    a.zona_id                    AS "zoneId",
    z.codigo                     AS "zoneCode",
    z.nombre                     AS "zoneName",
    -- Client Data
    c.clienteid                  AS "clientId",
    COALESCE(ci.nombres || ' ' || ci.apellidos, e.razonsocial) AS "clientName",
    COALESCE(ci.direccion, e.direccion)                        AS "clientAddress",
    cc.phones                    AS "clientPhones",
    cc.emails                    AS "clientEmails",
    -- Property Data
    p.predioid                   AS "propertyId",
    p.callejon                   AS "propertyAlleyway",
    p.sector                     AS "propertySector",
    p.direccion                  AS "propertyAddress",
    p.coordenadas                AS "propertyCoordinates",
    p.referencia                 AS "propertyReference",
    p.altitud                    AS "propertyAltitude",
    p.precision                  AS "propertyPrecision",
    p.zona_geometrica            AS "propertyGeometricZone",
    tp.tipopredioid              AS "propertyTypeId",
    tp.nombre                    AS "propertyTypeName"
FROM acometida a
INNER JOIN cliente c       ON c.clienteid = a.clienteid
LEFT JOIN predio p         ON p.clavecatastral = a.predioclavecatastral
LEFT JOIN ciudadano ci     ON ci.ciudadanoid = c.clienteid
LEFT JOIN empresa e        ON e.ruc = c.clienteid
LEFT JOIN cliente_contacto cc ON cc.clienteid = c.clienteid
INNER JOIN tarifa t        ON t.tarifaid = a.tarifaid
LEFT JOIN tipopredio tp    ON tp.tipopredioid = p.tipopredioid
INNER JOIN public.zona z    ON z.zona_id = a.zona_id
WHERE a.acometidaid = $1;
      `;
      const params: string[] = [propertyCadastralKey];
      const result =
        await this.postgresqlService.query<ConnectionAndPropertyResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection found for property cadastral key ${propertyCadastralKey}`,
        });
      }

      return ConnectionPostgreSqlAdapter.fromConnectionAndPropertySqlResponseToConnectionAndPropertyResponse(
        result[0],
      );
    } catch (error) {
      throw error;
    }
  }

  async findConnectionWithPropertyByCadastralKey(
    cadastralKey: string,
  ): Promise<ConnectionWithPropertyResponse | null> {
    try {
      const query: string = `
        SELECT
            -- Connection Data
            a.acometidaid                AS "connectionId",
            a.clienteid                  AS "clientId",
            a.tarifaid                   AS "connectionRateId",
            t.nombre                     AS "connectionRateName",
            a.numeromedidor              AS "connectionMeterNumber",
            a.sector                     AS "connectionSector",
            a.cuenta                     AS "connectionAccount",
            a.clavecatastral             AS "connectionCadastralKey",
            a.numerocontrato             AS "connectionContractNumber",
            a.alcantarillado             AS "connectionSewerage",
            a.estado                     AS "connectionStatus",
            a.direccion                  AS "connectionAddress",
            a.fechainstalacion           AS "connectionInstallationDate",
            a.numeropersonas             AS "connectionPeopleNumber",
            a.zona                       AS "connectionZone",
            a.coordenadas                AS "connectionCoordinates",
            a.referencia                 AS "connectionReference",
            a.metadata                   AS "connectionMetadata",
            a.altitud                    AS "connectionAltitude",
            a.precision                  AS "connectionPrecision",
            a.fechageolocalizacion       AS "connectionGeolocationDate",
            a.zona_geometrica            AS "connectionGeometricZone",
            a.predioclavecatastral       AS "propertyCadastralKey",
            a.zona_id                    AS "zoneId",
            z.codigo                     AS "zoneCode",
            z.nombre                     AS "zoneName",
            CASE
                WHEN e.ruc IS NOT NULL THEN
                    jsonb_build_object(
                        'companyId', e.empresaid,
                        'commercialName', e.nombrecomercial,
                        'businessName', e.razonsocial,
                        'ruc', e.ruc,
                        'address', e.direccion,
                        'parishId', e.parroquiaid,
                        'country', e.pais,
                        'clientId', e.clienteid,
                        'phones', cc.phones,
                        'emails', cc.emails
                    )
                ELSE NULL
            END AS "company",

            -- Person Data (if applicable)
            CASE
                WHEN ci.ciudadanoid IS NOT NULL THEN
                    jsonb_build_object(
                        'personId', ci.ciudadanoid,
                        'firstName', ci.nombres,
                        'lastName', ci.apellidos,
                        'birthDate', ci.fechanacimiento,
                        'isDeceased', ci.fallecido,
                        'genderId', ci.sexoid,
                        'civilStatusId', ci.estadocivilid,
                        'professionId', ci.profesionid,
                        'parishId', ci.parroquiaid,
                        'address', ci.direccion,
                        'country', ci.paisorigen,
                        'phones', cc.phones,
                        'emails', cc.emails
                    )
                ELSE NULL
            END AS "person",

            -- Properties (JSON array)
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'propertyId', p.predioid,
                            'propertyCadastralKey', p.clavecatastral,
                            'propertyAlleyway', p.callejon,
                            'propertySector', p.sector,
                            'propertyAddress', p.direccion,
                            'propertyCoordinates', p.coordenadas,
                            'propertyReference', p.referencia,
                            'propertyAltitude', p.altitud,
                            'propertyPrecision', p.precision,
                            'propertyGeometricZone', p.zona_geometrica,
                            'propertyTypeId', tp.tipopredioid,
                            'propertyTypeName', tp.nombre
                        )
                    )
                    FROM predio p
                    LEFT JOIN tipopredio tp ON tp.tipopredioid = p.tipopredioid
                    WHERE p.clienteid = a.clienteid
                ),
                '[]'::jsonb
            ) AS "properties"

        FROM acometida a
        INNER JOIN cliente c           ON c.clienteid = a.clienteid
        LEFT JOIN ciudadano ci         ON ci.ciudadanoid = c.clienteid
        LEFT JOIN empresa e            ON e.ruc = c.clienteid
        LEFT JOIN cliente_contacto cc  ON cc.clienteid = c.clienteid
        INNER JOIN tarifa t            ON t.tarifaid = a.tarifaid
        INNER JOIN public.zona z on z.zona_id = a.zona_id
        WHERE a.acometidaid = $1;
      `;
      const params: string[] = [cadastralKey];
      const result =
        await this.postgresqlService.query<ConnectionWithPropertySqlResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection found for cadastral key ${cadastralKey}`,
        });
      }

      return ConnectionPostgreSqlAdapter.fromConnectionWithPropertySqlResponseToConnectionWithPropertyResponse(
        result[0],
      );
    } catch (error) {
      throw error;
    }
  }
}
