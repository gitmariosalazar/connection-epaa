import { Injectable } from '@nestjs/common';
import { InterfaceConnectionRepository } from '../../../../domain/contracts/connection.interface.repository';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../../../../domain/schemas/dto/response/connection.response';
import { DashboardAdvanceResponse } from '../../../../domain/schemas/dto/response/dashboard.response';
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
import {
  BulkStateChangeResponse,
  ConnectionsByStateResponse,
  ConnectionStateHistoryResponse,
  ConnectionStateResponse,
  StateSummaryResponse,
} from '../../../../domain/schemas/dto/response/connection-state.response';
import {
  DatabaseAbstract,
  IDatabaseClient,
} from '../../../../../../shared/connections/database/abstract/abstract.database';
import { ConnectionSqlAdapter } from '../../../adapters/postgresql.connection.adapter';

@Injectable()
export class MySQLConnectionPersistence
  implements InterfaceConnectionRepository
{
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse> {
    try {
      const query = `
      SELECT JSON_OBJECT(
        'resumen', (
            SELECT JSON_OBJECT(
              'total_universo', COUNT(*),
              'pct_progreso_total', ROUND(AVG(CAST(actualizacion_completa AS UNSIGNED)) * 100, 1),
              'actualizaciones_hoy', SUM(CASE WHEN ultima_modificacion_global > DATE(NOW()) THEN 1 ELSE 0 END)
            )
            FROM vw_avance_actualizacion_acometidas
        ),
        'historico', COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT('fecha', h.fecha, 'registros_completados', h.registros_completados))
            FROM (
                SELECT 
                    DATE(ultima_modificacion_global) as fecha,
                    count(*) as registros_completados
                FROM vw_avance_actualizacion_acometidas
                WHERE actualizacion_completa = true
                  AND ultima_modificacion_global > NOW() - INTERVAL 30 DAY
                GROUP BY DATE(ultima_modificacion_global)
                ORDER BY fecha
            ) h
        ), JSON_ARRAY()),
        'distribucion', COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT('categoria', d.categoria, 'cantidad', d.cantidad))
            FROM (
                SELECT 
                    CASE 
                        WHEN actualizacion_completa THEN 'Completado (Full)'
                        WHEN NOT cliente_actualizado THEN 'Pendiente Datos Cliente'
                        WHEN NOT predio_actualizado THEN 'Pendiente Ficha Predial'
                        ELSE 'Pendiente Geolocalización'
                    END as categoria,
                    count(*) as cantidad
                FROM vw_avance_actualizacion_acometidas
                GROUP BY categoria
            ) d
        ), JSON_ARRAY()),
        'porZonas', COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT('zona_id', z.zona_id, 'total', z.total, 'completados', z.completados, 'pendientes', z.pendientes))
            FROM (
                SELECT 
                    zona_id,
                    count(*) as total,
                    SUM(CASE WHEN actualizacion_completa THEN 1 ELSE 0 END) as completados,
                    SUM(CASE WHEN NOT actualizacion_completa THEN 1 ELSE 0 END) as pendientes
                FROM vw_avance_actualizacion_acometidas
                GROUP BY zona_id
                ORDER BY total DESC
            ) z
        ), JSON_ARRAY()),
        
        'distribucionTarifas', COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT('tarifa', dt.tarifa, 'cantidad', dt.cantidad))
            FROM (
                SELECT 
                    ct.nombre as tarifa,
                    count(a.acometida_id) as cantidad
                FROM acometida a
                LEFT JOIN tarifa t ON t.tarifa_id = a.tarifa_id
                LEFT JOIN categoria ct ON ct.categoria_id = t.categoria_id
                GROUP BY ct.nombre
                ORDER BY cantidad DESC
            ) dt
        ), JSON_ARRAY()),

        'coberturaAlcantarillado', (
            SELECT JSON_OBJECT('con_alcantarillado', ca.con_alcantarillado, 'sin_alcantarillado', ca.sin_alcantarillado)
            FROM (
                SELECT 
                    COALESCE(SUM(CASE WHEN alcantarillado = true THEN 1 ELSE 0 END), 0) as con_alcantarillado,
                    COALESCE(SUM(CASE WHEN alcantarillado = false OR alcantarillado IS NULL THEN 1 ELSE 0 END), 0) as sin_alcantarillado
                FROM acometida
            ) ca
        ),

        'calidadGps', (
            SELECT JSON_OBJECT('precision_promedio', cg.precision_promedio)
            FROM (
                SELECT 
                    COALESCE(ROUND(AVG(precision_prom), 2), 0) as precision_promedio
                FROM (SELECT \`precision\` as precision_prom FROM acometida WHERE \`precision\` IS NOT NULL AND \`precision\` > 0) p
            ) cg
        ),

        'instalacionesRecientesCoords', COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT('coordenadas', irc.coordenadas, 'fecha', irc.fecha))
            FROM (
                SELECT 
                    coordenadas,
                    fecha_instalacion as fecha
                FROM acometida
                WHERE fecha_instalacion >= DATE_FORMAT(NOW(), '%Y-01-01')
                  AND coordenadas IS NOT NULL
                LIMIT 100
            ) irc
        ), JSON_ARRAY()),

        'curvaCrecimiento', COALESCE((
            SELECT JSON_ARRAYAGG(JSON_OBJECT('mes', cc.mes, 'nuevas_acometidas', cc.nuevas_acometidas))
            FROM (
                SELECT 
                    DATE_FORMAT(fecha_instalacion, '%Y-%m') as mes,
                    count(*) as nuevas_acometidas
                FROM acometida
                WHERE fecha_instalacion IS NOT NULL
                  AND fecha_instalacion >= NOW() - INTERVAL 12 MONTH
                GROUP BY DATE_FORMAT(fecha_instalacion, '%Y-%m')
                ORDER BY mes ASC
            ) cc
        ), JSON_ARRAY()),

        'poblacionServida', (
            SELECT JSON_OBJECT('total_habitantes', ps.total_habitantes)
            FROM (
                SELECT 
                    COALESCE(SUM(a.numero_personas), 0) as total_habitantes
                FROM acometida a
                JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
                WHERE est.permite_lectura = TRUE
            ) ps
        ),

        'coberturaMedidores', (
            SELECT JSON_OBJECT('con_medidor', cm.con_medidor, 'sin_medidor', cm.sin_medidor)
            FROM (
                SELECT 
                    SUM(CASE WHEN numero_medidor IS NOT NULL AND numero_medidor != '' AND UPPER(numero_medidor) != 'S/M' THEN 1 ELSE 0 END) as con_medidor,
                    SUM(CASE WHEN numero_medidor IS NULL OR numero_medidor = '' OR UPPER(numero_medidor) = 'S/M' THEN 1 ELSE 0 END) as sin_medidor
                FROM acometida
            ) cm
        ),

        'estadoRed', (
            SELECT JSON_OBJECT('activas', er.activas, 'inactivas', er.inactivas)
            FROM (
                SELECT 
                    SUM(CASE WHEN est.permite_lectura = TRUE  THEN 1 ELSE 0 END) as activas,
                    SUM(CASE WHEN est.permite_lectura = FALSE THEN 1 ELSE 0 END) as inactivas
                FROM acometida a
                JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
            ) er
        )
      ) as stats;
      `;
      const result = await this.databaseService.query<any>(query, []);
      if (!result || result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve dashboard stats',
        });
      }
      return result[0].stats as DashboardAdvanceResponse;
    } catch (error) {
      throw error;
    }
  }

  // Implementation of InterfaceConnectionRepository methods
  async verifyConnectionExists(connectionId: string): Promise<boolean> {
    try {
      const query: string = `SELECT EXISTS (SELECT 1 FROM acometida WHERE acometida_id = ?)`;
      const params: string[] = [connectionId];
      const result = await this.databaseService.query<Exists>(query, params);
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
            a.estado_id as "connection_state_id",
            est.nombre as "connection_status",
            est.permite_lectura as "connection_is_readable",
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
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        WHERE a.acometida_id = ?;
      `;
      const params: string[] = [connectionId];
      const result = await this.databaseService.query<ConnectionSqlResponse>(
        query,
        params,
      );

      const response: ConnectionResponse[] = result.map((connection) =>
        ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
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

  async findConnectionsBySector(
    sector: string,
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
          a.estado_id as "connection_state_id",
          est.nombre as "connection_status",
          est.permite_lectura as "connection_is_readable",
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
      LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
      WHERE a.sector = ?
      ORDER BY a.created_at DESC,a.acometida_id
      LIMIT ? OFFSET ?;
    `;
      const params: (string | number)[] = [
        sector,
        Number(limit),
        Number(offset),
      ];
      const result = await this.databaseService.query<ConnectionSqlResponse>(
        query,
        params,
      );

      const response: ConnectionResponse[] = result.map((connection) =>
        ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
          connection,
        ),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections found in sector ${sector}`,
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findAllConnectionsByClientId(
    clientId: string,
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
          a.estado_id as "connection_state_id",
          est.nombre as "connection_status",
          est.permite_lectura as "connection_is_readable",
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
      LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
      WHERE a.cliente_id = ?
      ORDER BY a.created_at DESC,a.acometida_id
      LIMIT ? OFFSET ?;
    `;
      const params: (string | number)[] = [
        clientId,
        Number(limit),
        Number(offset),
      ];
      const result = await this.databaseService.query<ConnectionSqlResponse>(
        query,
        params,
      );

      const response: ConnectionResponse[] = result.map((connection) =>
        ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
          connection,
        ),
      );

      if (response.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connections found by cliente ID ${clientId}`,
        });
      }

      return response;
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
            a.estado_id as "connection_state_id",
            est.nombre as "connection_status",
            est.permite_lectura as "connection_is_readable",
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
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        ORDER BY a.created_at DESC,a.acometida_id
        LIMIT ? OFFSET ?;
      `;
      const params: number[] = [Number(limit), Number(offset)];
      const result = await this.databaseService.query<ConnectionSqlResponse>(
        query,
        params,
      );

      const response: ConnectionResponse[] = result.map((connection) =>
        ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
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
        DELETE FROM acometida WHERE acometida_id = ?;
      `;
      const params: string[] = [connectionId];
      const result = await this.databaseService.query(query, params);

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
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        );
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

      const result: any = await this.databaseService.query(query, params);
      if (result.affectedRows === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: `Failed to create connection.`,
        });
      }
      const selectQuery = `SELECT 
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
          zona_id as "zone_id"
        FROM acometida WHERE acometida_id = ?;`;
      const selectResult =
        await this.databaseService.query<ConnectionSqlResponse>(selectQuery, [
          connection.getConnectionId(),
        ]);
      return ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
        selectResult[0],
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
          cliente_id = COALESCE(?, cliente_id),
          tarifa_id = COALESCE(?, tarifa_id),
          numero_medidor = COALESCE(?, numero_medidor),
          sector = COALESCE(?, sector),
          cuenta = COALESCE(?, cuenta),
          clave_catastral = COALESCE(?, clave_catastral),
          numero_contrato = COALESCE(?, numero_contrato),
          alcantarillado = COALESCE(?, alcantarillado),
          estado = COALESCE(?, estado),
          direccion = COALESCE(?, direccion),
          fecha_instalacion = COALESCE(?, fecha_instalacion),
          numero_personas = COALESCE(?, numero_personas),
          zona = COALESCE(?, zona),
          coordenadas = COALESCE(?, coordenadas),
          referencia = COALESCE(?, referencia),
          metadata = COALESCE(?, metadata),
          altitud = COALESCE(?, altitud),
          precision = COALESCE(?, precision),
          fecha_geolocalizacion = COALESCE(?, fecha_geolocalizacion),
          predio_clave_catastral = COALESCE(?, predio_clave_catastral),
          zona_id = COALESCE(?, zona_id)
        WHERE acometida_id = ?;
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

      const result: any = await this.databaseService.query(query, params);
      if (result.affectedRows === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: `Failed to update connection with ID ${connectionId}.`,
        });
      }
      const selectQuery = `SELECT 
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
          zona_id as "zone_id"
        FROM acometida WHERE acometida_id = ?;`;
      const selectResult =
        await this.databaseService.query<ConnectionSqlResponse>(selectQuery, [
          connectionId,
        ]);
      return ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
        selectResult[0],
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
    a.estado_id                  AS "connection_state_id",
    est.nombre                   AS "connection_status",
    est.permite_lectura          AS "connection_is_readable",
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
    COALESCE(CONCAT(ci.nombres, ' ', ci.apellidos), e.razon_social) AS "client_name",
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
INNER JOIN zona z    ON z.zona_id = a.zona_id
LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
WHERE a.acometida_id = ?;
      `;
      const params: string[] = [propertyCadastralKey];
      const result =
        await this.databaseService.query<ConnectionAndPropertySqlResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection found for property cadastral key ${propertyCadastralKey}`,
        });
      }

      return ConnectionSqlAdapter.fromConnectionAndPropertySqlResponseToConnectionAndPropertyResponse(
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
            a.estado_id                   AS "connection_state_id",
            est.nombre                    AS "connection_status",
            est.permite_lectura           AS "connection_is_readable",
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
        INNER JOIN zona z on z.zona_id = a.zona_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        WHERE a.acometida_id = ?;
      `;
      const params: string[] = [cadastralKey];
      const result =
        await this.databaseService.query<ConnectionWithPropertySqlResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection found for cadastral key ${cadastralKey}`,
        });
      }

      return ConnectionSqlAdapter.fromConnectionWithPropertySqlResponseToConnectionWithPropertyResponse(
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
            a.estado_id                  AS "connection_state_id",
            est.nombre                   AS "connection_status",
            est.permite_lectura          AS "connection_is_readable",
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
        INNER JOIN zona z       ON z.zona_id = a.zona_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        ${whereClause}
        ORDER BY a.acometida_id
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1};
      `;
      paramsQuery.push(limit, offset);

      const result =
        await this.databaseService.query<ConnectionWithoutPropertySqlResponse>(
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
        ConnectionSqlAdapter.fromConnectionWithoutPropertySqlResponseToConnectionWithoutPropertyResponse(
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
        a.estado_id AS "connection_state_id",
        est.nombre AS "connection_status",
        est.permite_lectura AS "connection_is_readable",
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
      LEFT JOIN zona z ON z.zona_id = a.zona_id
      LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
      ${whereClause}
      ORDER BY a.acometida_id
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

      paramsQuery.push(limit, offset);

      const result = await this.databaseService.query<ConnectionSqlResponse>(
        sql,
        paramsQuery,
      );

      // Mapeo a tu respuesta
      const response = result.map((row) =>
        ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(row),
      );

      return response;
    } catch (error) {
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error interno al obtener las conexiones',
      });
    }
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cambia el estado de una acometida insertando en historial_estados_acometida.
   * El trigger fn_actualizar_estado_activo se encarga de sincronizar acometida.estado_id
   * y de desactivar el historial anterior automáticamente.
   */
  async changeConnectionState(
    connectionId: string,
    newStateId: number,
    userId: string,
    motivo: string,
    detallesTecnicos?: Record<string, any>,
  ): Promise<ConnectionStateResponse> {
    try {
      const query = `
        INSERT INTO historial_estados_acometida
          (acometida_id, estado_id, usuario_id, motivo, activo, detalles_tecnicos)
        VALUES (?, ?, ?::uuid, ?, TRUE, ?::jsonb)
        RETURNING
          historial_estados_acometida.id             AS "historialId",
          historial_estados_acometida.acometida_id   AS "connectionId",
          historial_estados_acometida.estado_id      AS "stateId",
          historial_estados_acometida.fecha_cambio   AS "changedAt",
          historial_estados_acometida.motivo         AS "motivo";
      `;

      const result = await this.databaseService.query<any>(query, [
        connectionId,
        newStateId,
        userId,
        motivo,
        JSON.stringify(detallesTecnicos ?? {}),
      ]);

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Error al cambiar el estado de la acometida',
        });
      }

      // Recuperar el estado actualizado desde cat_estados_acometida
      const stateInfo = await this.databaseService.query<any>(
        `SELECT est.nombre, est.permite_lectura, est.permite_facturar
         FROM cat_estados_acometida est WHERE est.id_estado = ?`,
        [newStateId],
      );

      const state = stateInfo[0];
      return {
        connectionId: result[0].connectionId,
        currentStateId: newStateId,
        currentStateName: state?.nombre ?? '',
        allowsReading: state?.permite_lectura ?? false,
        allowsBilling: state?.permite_facturar ?? false,
        changedAt: result[0].changedAt,
        motivo: result[0].motivo,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Devuelve el historial completo de cambios de estado de una acometida,
   * incluyendo el usuario responsable, el estado anterior y el nuevo.
   */
  async getConnectionStateHistory(
    connectionId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionStateHistoryResponse[]> {
    try {
      const query = `
        SELECT
          h.id                        AS "historialId",
          h.acometida_id              AS "connectionId",
          h.estado_id                 AS "stateId",
          est.nombre                  AS "stateName",
          est.permite_facturar        AS "allowsBilling",
          est.permite_lectura         AS "allowsReading",
          h.fecha_cambio              AS "changedAt",
          h.usuario_id::text          AS "userId",
          u.email                     AS "userEmail",
          h.motivo                    AS "motivo",
          h.activo                    AS "active",
          COALESCE(h.detalles_tecnicos, '{}'::jsonb) AS "technicalDetails"
        FROM historial_estados_acometida h
        JOIN cat_estados_acometida est ON est.id_estado = h.estado_id
        LEFT JOIN usuarios u ON u.usuario_id = h.usuario_id
        WHERE h.acometida_id = ?
        ORDER BY h.fecha_cambio DESC
        LIMIT ? OFFSET ?;
      `;

      const result =
        await this.databaseService.query<ConnectionStateHistoryResponse>(
          query,
          [connectionId, Number(limit), Number(offset)],
        );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retorna todas las acometidas que se encuentran en un estado específico.
   * Permite filtrar por sector y paginar.
   */
  async getConnectionsByState(
    stateId: number,
    sector?: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ConnectionsByStateResponse[]> {
    try {
      const query = `
        SELECT
          a.acometida_id                                     AS "connectionId",
          a.sector                                           AS "sector",
          a.cuenta                                           AS "account",
          a.direccion                                        AS "address",
          COALESCE(a.numero_medidor, '')                     AS "meterNumber",
          COALESCE(
            ci.nombres || ' ' || ci.apellidos,
            e.razon_social,
            'Sin nombre'
          )                                                  AS "clientName",
          est.nombre                                         AS "stateName",
          h.fecha_cambio                                     AS "stateChangedAt"
        FROM acometida a
        JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        JOIN historial_estados_acometida h
          ON h.acometida_id = a.acometida_id AND h.activo = TRUE
        LEFT JOIN cliente c ON c.cliente_id = a.cliente_id
        LEFT JOIN ciudadano ci ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e ON e.ruc = c.cliente_id
        WHERE est.id_estado = ?
          AND (?::int IS NULL OR a.sector = ?)
        ORDER BY h.fecha_cambio DESC
        LIMIT ? OFFSET ?;
      `;

      const result =
        await this.databaseService.query<ConnectionsByStateResponse>(query, [
          stateId,
          sector ?? null,
          Number(limit),
          Number(offset),
        ]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Devuelve un resumen ejecutivo de cuántas acometidas hay en cada estado,
   * incluyendo porcentaje sobre el total. Ideal para KPI dashboard.
   */
  async getStateSummaryDashboard(): Promise<StateSummaryResponse[]> {
    try {
      const query = `
        SELECT
          est.id_estado                                       AS "stateId",
          est.nombre                                          AS "stateName",
          est.permite_lectura                                 AS "allowsReading",
          est.permite_facturar                                AS "allowsBilling",
          COUNT(a.acometida_id)                               AS "total",
          ROUND(
            COUNT(a.acometida_id)::numeric
            / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100,
            2
          )                                                   AS "percentage"
        FROM cat_estados_acometida est
        LEFT JOIN acometida a ON a.estado_id = est.id_estado
        GROUP BY est.id_estado, est.nombre, est.permite_lectura, est.permite_facturar
        ORDER BY "total" DESC;
      `;

      const result = await this.databaseService.query<StateSummaryResponse>(
        query,
        [],
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambia el estado de múltiples acometidas en una sola operación transaccional.
   * Útil para suspensión masiva de morosos o reconexiones grupales.
   */
  async bulkChangeConnectionState(
    connectionIds: string[],
    newStateId: number,
    userId: string,
    motivo: string,
  ): Promise<BulkStateChangeResponse> {
    try {
      if (!connectionIds || connectionIds.length === 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'No connection IDs provided for bulk state change',
        });
      }

      // Insertar en historial para cada acometida — el trigger sincroniza acometida.estado_id
      const query = `
        INSERT INTO historial_estados_acometida
          (acometida_id, estado_id, usuario_id, motivo, activo)
        SELECT
          unnest(?::varchar[]),
          ?,
          ?::uuid,
          ?,
          TRUE
        RETURNING acometida_id AS "connectionId";
      `;

      const result = await this.databaseService.query<{ connectionId: string }>(
        query,
        [connectionIds, newStateId, userId, motivo],
      );

      const stateInfo = await this.databaseService.query<any>(
        `SELECT nombre FROM cat_estados_acometida WHERE id_estado = ?`,
        [newStateId],
      );

      return {
        updatedCount: result.length,
        stateId: newStateId,
        stateName: stateInfo[0]?.nombre ?? '',
        affectedConnectionIds: result.map((r) => r.connectionId),
      };
    } catch (error) {
      throw error;
    }
  }
}
