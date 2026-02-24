import { Injectable } from '@nestjs/common';
import { DatabaseServicePostgreSQL } from '../../../../../../shared/connections/database/postgresql/postgresql.service';
import { InterfaceConnectionRepository } from '../../../../domain/contracts/connection.interface.repository';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../../../../domain/schemas/dto/response/connection.response';
import { ConnectionPostgreSqlAdapter } from '../adapters/postgresql.connection.adapter';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { ConnectionModel } from '../../../../domain/schemas/models/connection.model';
import { Exists } from '../../../../../../shared/interfaces/verify-exists';
import {
  ConnectionAndPropertySqlResponse,
  ConnectionSqlResponse,
  ConnectionWithoutPropertySqlResponse,
  ConnectionWithPropertySqlResponse,
} from '../../../interfaces/sql/connection.sql.response';

@Injectable()
export class PostgresqlConnectionPersistence implements InterfaceConnectionRepository {
  constructor(private readonly postgresqlService: DatabaseServicePostgreSQL) {}

  // Implementation of InterfaceConnectionRepository methods
  async verifyConnectionExists(connectionId: string): Promise<boolean> {
    try {
      const query: string = `SELECT EXISTS (SELECT 1 FROM acometida WHERE acometida_id = $1)`;
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
            a.acometida_id as "connection_id",
            a.cliente_id as "client_id",
            a.tarifa_id as "connection_rate_id",
            ct.nombre as "connection_rate_name",
            a.numero_medidor as "connection_meter_number",
            a.sector as "connection_sector",
            a.cuenta as "connection_account",
            a.clave_catastral as "connection_cadastral_key",
            a.numero_contrato as "connection_contract_number",
            a.alcantarillado as "connection_sewerage",
            a.estado as "connection_status",
            a.direccion as "connection_address",
            a.fecha_instalacion as "connection_installation_date",
            a.numero_personas as "connection_people_numbers",
            a.zona as "connection_zone",
            a.coordenadas as "connection_coordinates",
            a.referencia as "connection_reference",
            a.metadata as "connection_metadata",
            a.altitud as "connection_altitude",
            a.precision as "connection_precision",
            a.fecha_geolocalizacion as "connection_geolocation_date",
            a.zona_geometrica as "connection_geometric_zone",
            a.predio_clave_catastral as "property_cadastral_key",
            a.zona_id as "zone_id"
        FROM acometida a INNER JOIN cliente c ON c.cliente_id = a.cliente_id
        INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        WHERE a.acometida_id = $1;
      `;
      const params: string[] = [connectionId];
      const result = await this.postgresqlService.query<ConnectionSqlResponse>(
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
            a.acometida_id as "connection_id",
            a.cliente_id as "client_id",
            a.tarifa_id as "connection_rate_id",
            ct.nombre as "connection_rate_name",
            a.numero_medidor as "connection_meter_number",
            a.sector as "connection_sector",
            a.cuenta as "connection_account",
            a.clave_catastral as "connection_cadastral_key",
            a.numero_contrato as "connection_contract_number",
            a.alcantarillado as "connection_sewerage",
            a.estado as "connection_status",
            a.direccion as "connection_address",
            a.fecha_instalacion as "connection_installation_date",
            a.numero_personas as "connection_people_numbers",
            a.zona as "connection_zone",
            a.coordenadas as "connection_coordinates",
            a.referencia as "connection_reference",
            a.metadata as "connection_metadata",
            a.altitud as "connection_altitude",
            a.precision as "connection_precision",
            a.fecha_geolocalizacion as "connection_geolocation_date",
            a.zona_geometrica as "connection_geometric_zone",
            a.predio_clave_catastral as "property_cadastral_key",
            a.zona_id as "zone_id"
        FROM acometida a
        INNER JOIN cliente c ON c.cliente_id = a.cliente_id
        INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        ORDER BY a.acometida_id
        LIMIT $1 OFFSET $2;
      `;
      const params: number[] = [limit, offset];
      const result = await this.postgresqlService.query<ConnectionSqlResponse>(
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
        DELETE FROM acometida WHERE acometida_id = $1;
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
          acometida_id,
          cliente_id,
          tarifa_id,
          numero_medidor,
          sector,
          cuenta,
          clave_catastral,
          numero_contrato,
          alcantarillado,
          estado,
          direccion,
          fecha_instalacion,
          numero_personas,
          zona,
          coordenadas,
          referencia,
          metadata,
          altitud,
          precision,
          fecha_geolocalizacion,
          predio_clave_catastral,
          zona_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING
          acometida_id as "connection_id",
          cliente_id as "client_id",
          tarifa_id as "connection_rate_id",
          numero_medidor as "connection_meter_number",
          sector as "connection_sector",
          cuenta as "connection_account",
          clave_catastral as "connection_cadastral_key",
          numero_contrato as "connection_contract_number",
          alcantarillado as "connection_sewerage",
          estado as "connection_status",
          direccion as "connection_address",
          fecha_instalacion as "connection_installation_date",
          numero_personas as "connection_people_numbers",
          zona as "connection_zone",
          coordenadas as "connection_coordinates",
          referencia as "connection_reference",
          metadata as "connection_metadata",
          altitud as "connection_altitude",
          precision as "connection_precision",
          fecha_geolocalizacion as "connection_geolocation_date",
          zona_geometrica as "connection_geometric_zone",
          predio_clave_catastral as "property_cadastral_key",
          zona_id as "zone_id";
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

      const result = await this.postgresqlService.query<ConnectionSqlResponse>(
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
          cliente_id = COALESCE($2, cliente_id),
          tarifa_id = COALESCE($3, tarifa_id),
          numero_medidor = COALESCE($4, numero_medidor),
          sector = COALESCE($5, sector),
          cuenta = COALESCE($6, cuenta),
          clave_catastral = COALESCE($7, clave_catastral),
          numero_contrato = COALESCE($8, numero_contrato),
          alcantarillado = COALESCE($9, alcantarillado),
          estado = COALESCE($10, estado),
          direccion = COALESCE($11, direccion),
          fecha_instalacion = COALESCE($12, fecha_instalacion),
          numero_personas = COALESCE($13, numero_personas),
          zona = COALESCE($14, zona),
          coordenadas = COALESCE($15, coordenadas),
          referencia = COALESCE($16, referencia),
          metadata = COALESCE($17, metadata),
          altitud = COALESCE($18, altitud),
          precision = COALESCE($19, precision),
          fecha_geolocalizacion = COALESCE($20, fecha_geolocalizacion),
          predio_clave_catastral = COALESCE($21, predio_clave_catastral),
          zona_id = COALESCE($22, zona_id)
        WHERE acometida_id = $1
        RETURNING
          acometida_id as "connection_id",
          cliente_id as "client_id",
          tarifa_id as "connection_rate_id",
          numero_medidor as "connection_meter_number",
          sector as "connection_sector",
          cuenta as "connection_account",
          clave_catastral as "connection_cadastral_key",
          numero_contrato as "connection_contract_number",
          alcantarillado as "connection_sewerage",
          estado as "connection_status",
          direccion as "connection_address",
          fecha_instalacion as "connection_installation_date",
          numero_personas as "connection_people_numbers",
          zona as "connection_zone",
          coordenadas as "connection_coordinates",
          referencia as "connection_reference",
          metadata as "connection_metadata",
          altitud as "connection_altitude",
          precision as "connection_precision",
          fecha_geolocalizacion as "connection_geolocation_date",
          zona_geometrica as "connection_geometric_zone",
          predio_clave_catastral as "property_cadastral_key",
          zona_id as "zone_id";
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

      const result = await this.postgresqlService.query<ConnectionSqlResponse>(
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
    a.acometida_id                AS "connection_id",
    a.cliente_id                  AS "client_id",
    a.tarifa_id                   AS "connection_rate_id",
    ct.nombre                     AS "connection_rate_name",
    a.numero_medidor              AS "connection_meter_number",
    a.sector                     AS "connection_sector",
    a.cuenta                     AS "connection_account",
    a.clave_catastral             AS "connection_cadastral_key",
    a.numero_contrato             AS "connection_contract_number",
    a.alcantarillado             AS "connection_sewerage",
    a.estado                     AS "connection_status",
    a.direccion                  AS "connection_address",
    a.fecha_instalacion           AS "connection_installation_date",
    a.numero_personas             AS "connection_people_number",
    a.zona                       AS "connection_zone",
    a.coordenadas                AS "connection_coordinates",
    a.referencia                 AS "connection_reference",
    a.metadata                   AS "connection_metadata",
    a.altitud                    AS "connection_altitude",
    a.precision                  AS "connection_precision",
    a.fecha_geolocalizacion       AS "connection_geolocation_date",
    a.zona_geometrica            AS "connection_geometric_zone",
    a.predio_clave_catastral       AS "property_cadastral_key",
    a.zona_id                    AS "zone_id",
    z.codigo                     AS "zone_code",
    z.nombre                     AS "zone_name",
    -- Client Data
    c.cliente_id                  AS "client_id",
    COALESCE(ci.nombres || ' ' || ci.apellidos, e.razon_social) AS "client_name",
    COALESCE(ci.direccion, e.direccion)                        AS "client_address",
    cc.phones                    AS "client_phones",
    cc.correos                    AS "client_emails",
    -- Property Data
    p.predio_id                   AS "property_id",
    p.callejon                   AS "property_alleyway",
    p.sector                     AS "property_sector",
    p.direccion                  AS "property_address",
    p.coordenadas                AS "property_coordinates",
    p.referencia                 AS "property_reference",
    p.altitud                    AS "property_altitude",
    p.precision                  AS "property_precision",
    p.zona_geometrica            AS "property_geometric_zone",
    tp.tipo_predio_id              AS "property_type_id",
    tp.nombre                    AS "property_type_name"
FROM acometida a
INNER JOIN cliente c       ON c.cliente_id = a.cliente_id
LEFT JOIN predio p         ON p.clave_catastral = a.clave_catastral
LEFT JOIN ciudadano ci     ON ci.ciudadano_id = c.cliente_id
LEFT JOIN empresa e        ON e.ruc = c.cliente_id
LEFT JOIN cliente_contacto cc ON cc.cliente_id = c.cliente_id
INNER JOIN tarifa t        ON t.tarifa_id = a.tarifa_id
LEFT JOIN categoria ct ON t.categoria_id = ct.categoria_id
LEFT JOIN tipo_predio tp    ON tp.tipo_predio_id = p.tipo_predio_id
INNER JOIN public.zona z    ON z.zona_id = a.zona_id
WHERE a.acometida_id = $1;
      `;
      const params: string[] = [propertyCadastralKey];
      const result =
        await this.postgresqlService.query<ConnectionAndPropertySqlResponse>(
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
            a.acometida_id                AS "connection_id",
            a.cliente_id                  AS "client_id",
            a.tarifa_id                   AS "connection_rate_id",
            ct.nombre                     AS "connection_rate_name",
            a.numero_medidor              AS "connection_meter_number",
            a.sector                      AS "connection_sector",
            a.cuenta                      AS "connection_account",
            a.clave_catastral             AS "connection_cadastral_key",
            a.numero_contrato             AS "connection_contract_number",
            a.alcantarillado              AS "connection_sewerage",
            a.estado                      AS "connection_status",
            a.direccion                   AS "connection_address",
            a.fecha_instalacion           AS "connection_installation_date",
            a.numero_personas             AS "connection_people_number",
            a.zona                        AS "connection_zone",
            a.coordenadas                 AS "connection_coordinates",
            a.referencia                  AS "connection_reference",
            a.metadata                    AS "connection_metadata",
            a.altitud                     AS "connection_altitude",
            a.precision                   AS "connection_precision",
            a.fecha_geolocalizacion       AS "connection_geolocation_date",
            a.zona_geometrica             AS "connection_geometric_zone",
            a.predio_clave_catastral      AS "property_cadastral_key",
            a.zona_id                     AS "zone_id",
            z.codigo                      AS "zone_code",
            z.nombre                      AS "zone_name",
            CASE
                WHEN e.ruc IS NOT NULL THEN
                    jsonb_build_object(
                        'company_id', e.empresa_id,
                        'commercial_name', e.nombre_comercial,
                        'business_name', e.razon_social,
                        'ruc', e.ruc,
                        'address', e.direccion,
                        'parish_id', e.parroquia_id,
                        'country', e.pais,
                        'client_id', e.cliente_id,
                        'phones', cc.phones,
                        'emails', cc.correos
                    )
                ELSE NULL
            END AS "company",

            -- Person Data (if applicable)
            CASE
                WHEN ci.ciudadano_id IS NOT NULL THEN
                    jsonb_build_object(
                        'person_id', ci.ciudadano_id,
                        'first_name', ci.nombres,
                        'last_name', ci.apellidos,
                        'birth_date', ci.fecha_nacimiento,
                        'is_deceased', ci.fallecido,
                        'gender_id', ci.sexo_id,
                        'civil_status_id', ci.estado_civil_id,
                        'profession_id', ci.profesion_id,
                        'parish_id', ci.parroquia_id,
                        'address', ci.direccion,
                        'country', ci.pais_origen,
                        'phones', cc.phones,
                        'emails', cc.correos
                    )
                ELSE NULL
            END AS "person",

            -- Properties (JSON array)
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'property_id', p.predio_id,
                            'property_cadastral_key', p.clave_catastral,
                            'property_alleyway', p.callejon,
                            'property_sector', p.sector,
                            'property_address', p.direccion,
                            'property_coordinates', p.coordenadas::text,
                            'property_reference', p.referencia,
                            'property_altitude', p.altitud,
                            'property_precision', p.precision,
                            'property_geometric_zone', p.zona_geometrica,
                            'property_type_id', tp.tipo_predio_id,
                            'property_type_name', tp.nombre
                        )
                    )
                    FROM predio p
                    LEFT JOIN tipo_predio tp ON tp.tipo_predio_id = p.tipo_predio_id
                    WHERE p.cliente_id = a.cliente_id
                ),
                '[]'::jsonb
            ) AS "properties"

        FROM acometida a
        INNER JOIN cliente c           ON c.cliente_id = a.cliente_id
        LEFT JOIN ciudadano ci         ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e            ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc  ON cc.cliente_id = c.cliente_id
        INNER JOIN tarifa t            ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        INNER JOIN public.zona z on z.zona_id = a.zona_id
        WHERE a.acometida_id = $1;
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

  async findAllConnectionsWithProperty({
    limit = 50,
    offset = 0,
    query,
  }: {
    limit?: number;
    offset?: number;
    query?: string;
  }): Promise<ConnectionWithoutPropertyResponse[]> {
    try {
      const paramsQuery: any[] = [];
      let whereClause = '';
      let paramCounter = 1;

      // Si hay query de búsqueda, agregamos el filtro
      if (query && query.trim()) {
        whereClause = `
        WHERE (
          a.clave_catastral ILIKE $${paramCounter} OR
          a.numero_medidor ILIKE $${paramCounter} OR
          ci.nombres ILIKE $${paramCounter} OR
          ci.apellidos ILIKE $${paramCounter} OR
          a.cliente_id::text ILIKE $${paramCounter}
        )
      `;
        paramsQuery.push(`%${query.trim()}%`);
        paramCounter++;
      }

      const querySql: string = `
        SELECT
            -- Connection Data
            a.acometida_id                AS "connection_id",
            a.cliente_id                  AS "client_id",
            a.tarifa_id                   AS "connection_rate_id",
            ct.nombre                     AS "connection_rate_name",
            a.numero_medidor              AS "connection_meter_number",
            a.sector                     AS "connection_sector",
            a.cuenta                     AS "connection_account",
            a.clave_catastral             AS "connection_cadastral_key",
            a.numero_contrato             AS "connection_contract_number",
            a.alcantarillado             AS "connection_sewerage",
            a.estado                     AS "connection_status",
            a.direccion                  AS "connection_address",
            a.fecha_instalacion           AS "connection_installation_date",
            a.numero_personas             AS "connection_people_number",
            a.zona                       AS "connection_zone",
            a.coordenadas                AS "connection_coordinates",
            a.referencia                 AS "connection_reference",
            a.metadata                   AS "connection_metadata",
            a.altitud                    AS "connection_altitude",
            a.precision                  AS "connection_precision",
            a.fecha_geolocalizacion       AS "connection_geolocation_date",
            a.zona_geometrica            AS "connection_geometric_zone",
            a.predio_clave_catastral       AS "property_cadastral_key",
            a.zona_id                    AS "zone_id",
            z.codigo                     AS "zone_code",
            z.nombre                     AS "zone_name",

            -- Company Data (if applicable)
            CASE
                WHEN e.ruc IS NOT NULL THEN
                    jsonb_build_object(
                        'company_id', e.empresa_id,
                        'commercial_name', e.nombre_comercial,
                        'business_name', e.razon_social,
                        'ruc', e.ruc,
                        'address', e.direccion,
                        'parish_id', e.parroquia_id,
                        'country', e.pais,
                        'client_id', e.cliente_id,
                        'phones', cc.phones,
                        'emails', cc.correos
                    )
                ELSE NULL
            END AS "company",

            -- Person Data (if applicable)
            CASE
                WHEN ci.ciudadano_id IS NOT NULL THEN
                    jsonb_build_object(
                        'person_id', ci.ciudadano_id,
                        'first_name', ci.nombres,
                        'last_name', ci.apellidos,
                        'birth_date', ci.fecha_nacimiento,
                        'is_deceased', ci.fallecido,
                        'gender_id', ci.sexo_id,
                        'civil_status_id', ci.estado_civil_id,
                        'profession_id', ci.profesion_id,
                        'parish_id', ci.parroquia_id,
                        'address', ci.direccion,
                        'country', ci.pais_origen,
                        'phones', cc.phones,
                        'emails', cc.correos
                    )
                ELSE NULL
            END AS "person"

        FROM acometida a
        INNER JOIN cliente c           ON c.cliente_id = a.cliente_id
        LEFT JOIN ciudadano ci         ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e            ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc  ON cc.cliente_id = c.cliente_id
        INNER JOIN tarifa t            ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        INNER JOIN public.zona z       ON z.zona_id = a.zona_id
        ${whereClause}
        ORDER BY a.acometida_id
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1};
      `;
      paramsQuery.push(limit, offset);

      const result =
        await this.postgresqlService.query<ConnectionWithoutPropertySqlResponse>(
          querySql,
          paramsQuery,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections found.`,
        });
      }

      return result.map((connection) =>
        ConnectionPostgreSqlAdapter.fromConnectionWithoutPropertySqlResponseToConnectionWithoutPropertyResponse(
          connection,
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  async getConnectionsPaginated({
    limit = 50,
    offset = 0,
    query,
  }: {
    limit?: number;
    offset?: number;
    query?: string;
  }): Promise<ConnectionResponse[]> {
    try {
      const paramsQuery: any[] = [];
      let whereClause = '';
      let paramCounter = 1;

      // Si hay query de búsqueda, agregamos el filtro
      if (query && query.trim()) {
        whereClause = `
        WHERE (
          a.clave_catastral ILIKE $${paramCounter} OR
          a.numero_medidor ILIKE $${paramCounter} OR
          a.direccion ILIKE $${paramCounter} OR
          a.cliente_id::text ILIKE $${paramCounter}
        )
      `;
        paramsQuery.push(`%${query.trim()}%`);
        paramCounter++;
      }

      // Consulta base con todos los campos que necesitas
      const sql = `
      SELECT
        a.acometida_id AS "connection_id",
        a.cliente_id AS "client_id",
        a.tarifa_id AS "connection_rate_id",
        ct.nombre AS "connection_rate_name",
        a.numero_medidor AS "connection_meter_number",
        a.sector AS "connection_sector",
        a.cuenta AS "connection_account",
        a.clave_catastral AS "connection_cadastral_key",
        a.numero_contrato AS "connection_contract_number",
        a.alcantarillado AS "connection_sewerage",
        a.estado AS "connection_status",
        a.direccion AS "connection_address",
        a.fecha_instalacion AS "connection_installation_date",
        a.numero_personas AS "connection_people_numbers",
        a.zona AS "connection_zone",
        a.coordenadas AS "connection_coordinates",
        a.referencia AS "connection_reference",
        a.metadata AS "connection_metadata",
        a.altitud AS "connection_altitude",
        a.precision AS "connection_precision",
        a.fecha_geolocalizacion AS "connection_geolocation_date",
        a.zona_geometrica AS "connection_geometric_zone",
        a.predio_clave_catastral AS "property_cadastral_key",
        a.zona_id AS "zone_id",
        z.codigo AS "zone_code",
        z.nombre AS "zone_name"
      FROM acometida a
      INNER JOIN cliente c ON c.cliente_id = a.cliente_id
      INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
      INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
      LEFT JOIN public.zona z ON z.zona_id = a.zona_id
      ${whereClause}
      ORDER BY a.acometida_id
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

      paramsQuery.push(limit, offset);

      const result = await this.postgresqlService.query<ConnectionSqlResponse>(
        sql,
        paramsQuery,
      );

      // Mapeo a tu respuesta
      const response = result.map((row) =>
        ConnectionPostgreSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
          row,
        ),
      );

      return response;
    } catch (error) {
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error interno al obtener las conexiones',
      });
    }
  }
}
