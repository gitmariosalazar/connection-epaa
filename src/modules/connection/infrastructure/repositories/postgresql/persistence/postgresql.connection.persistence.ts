import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRepository } from '../../../../domain/contracts/connection.interface.repository';
import { IMeterHistoryRecorder } from '../../../services/meter-history-recorder.interface';
import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
  PropertyWithClientResponse,
} from '../../../../domain/schemas/dto/response/connection.response';
import {
  DashboardAdvanceResponse,
  LiveMapConnectionResponse,
} from '../../../../domain/schemas/dto/response/dashboard.response';
import { ConnectionSqlAdapter } from '../../../adapters/postgresql.connection.adapter';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { ConnectionModel } from '../../../../domain/schemas/models/connection.model';
import { Exists } from '../../../../../../shared/interfaces/verify-exists';
import {
  ConnectionAndPropertySqlResponse,
  ConnectionSqlResponse,
  ConnectionWithoutPropertySqlResponse,
  ConnectionWithPropertySqlResponse,
  LiveMapConnectionSqlResponse,
  PropertyWithClientSqlResponse,
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
import { CustomerDashboardResponseDto } from '../../../../domain/schemas/dto/response/customer-dashboard.dto';
import { CustomerDashboardMapper } from '../../../../application/mappers/customer-dashboard.mapper';
import {
  ClientDashboardResponse,
  ConnectionDashboardResponse,
} from '../../../../domain/schemas/dto/response/view-dashboard.response';
import {
  ClientDashboardSqlResult,
  ConnectionDashboardSqlResult,
} from '../../../interfaces/sql/view-dashboard.sql-result';
import { DashboardViewAdapter } from '../../../adapters/view-adapter';
import {
  MeterChangeDetail,
  UploadedMeterChangePhoto,
} from '../../../../domain/schemas/dto/request/change-meter.connection.request';
import { MeterChangeResponse } from '../../../../domain/schemas/dto/response/meter-change.response';

@Injectable()
export class PostgresqlConnectionPersistence implements InterfaceConnectionRepository {
  constructor(
    private readonly databaseService: DatabaseAbstract,
    @Inject('MeterHistoryRecorder')
    private readonly meterHistoryRecorder: IMeterHistoryRecorder,
  ) {}

  async getCustomerDashboard(
    clientId: string,
  ): Promise<CustomerDashboardResponseDto | null> {
    try {
      const query = `
        SELECT jsonb_build_object(
            
            -- 1. PERFIL DEL CLIENTE (Identidad y Contacto)
            'perfil', (
                SELECT COALESCE(
                    person, 
                    company, 
                    jsonb_build_object('client_id', client_id, 'nombre', 'Cliente no detallado')
                )
                FROM public.view_acometida_detalle
                WHERE client_id = $1
                LIMIT 1
            ),
  
            -- 2. RESUMEN DE SUS SERVICIOS (KPIs personales)
            'resumen', (
                SELECT jsonb_build_object(
                    'total_acometidas', COUNT(*),
                    'acometidas_activas', COUNT(*) FILTER (WHERE connection_status ILIKE '%activ%'),
                    'total_incidentes_reportados', (
                        SELECT COUNT(*) 
                        FROM public.view_incidentes_detalle 
                        WHERE connection_id IN (
                            SELECT connection_id FROM public.view_acometida_detalle WHERE client_id = $1
                        )
                    )
                )
                FROM public.view_acometida_detalle
                WHERE client_id = $1
            ),
  
            -- 3. LISTADO DE SUS ACOMETIDAS / MEDIDORES (Para mostrar en tarjetas)
            'acometidas', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'connection_id', connection_id,
                    'cadastral_key', connection_cadastral_key,
                    'address', connection_address,
                    'status', connection_status,
                    'rate_name', connection_rate_name,
                    'meter_number', connection_meter_number,
                    'has_sewerage', connection_sewerage,
                    'last_readings', last_readings
                )), '[]'::jsonb)
                FROM public.view_acometida_detalle
                WHERE client_id = $1
            ),
  
            -- 4. ÚLTIMOS INCIDENTES EN SUS ACOMETIDAS
            'incidentes_recientes', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'incident_code', incident_code,
                    'connection_id', connection_id,
                    'category', category_name,
                    'status', status,
                    'report_date', report_date
                ) ORDER BY report_date DESC), '[]'::jsonb)
                FROM public.view_incidentes_detalle
                WHERE connection_id IN (
                    SELECT connection_id 
                    FROM public.view_acometida_detalle 
                    WHERE client_id = $1
                )
                LIMIT 5
            )
  
        ) AS "customer_dashboard_data";
      `;
      const result = await this.databaseService.query<Record<string, unknown>>(
        query,
        [clientId],
      );

      if (
        !result ||
        result.length === 0 ||
        !result[0]?.customer_dashboard_data
      ) {
        return null;
      }
      return CustomerDashboardMapper.toDto(
        result[0].customer_dashboard_data as Record<string, unknown>,
      );
    } catch (error) {
      throw error;
    }
  }

  async getAdvanceDashboardStats(): Promise<DashboardAdvanceResponse> {
    try {
      const query = `
        WITH data_avance AS (
            -- 1. Evaluamos la vista una sola vez (PostgreSQL cachea / materializa el CTE)
            SELECT * FROM public.vw_avance_actualizacion_acometidas
        ),
        cte_resumen AS (
            SELECT 
                COUNT(*)::int as total_universo,
                ROUND(AVG(actualizacion_completa::int) * 100, 1)::float as pct_progreso_total,
                COUNT(*) FILTER (WHERE ultima_modificacion_global > date_trunc('day', now()))::int as actualizaciones_hoy
            FROM data_avance
        ),
        cte_historico AS (
            SELECT 
                date_trunc('day', ultima_modificacion_global)::date as fecha,
                count(*)::int as registros_completados
            FROM data_avance
            WHERE actualizacion_completa = true
              AND ultima_modificacion_global > now() - INTERVAL '30 days'
            GROUP BY 1
            ORDER BY 1
        ),
        cte_distribucion AS (
            SELECT 
                CASE 
                    WHEN actualizacion_completa THEN 'Completado (Full)'
                    WHEN NOT cliente_actualizado THEN 'Pendiente Datos Cliente'
                    WHEN NOT predio_actualizado THEN 'Pendiente Ficha Predial'
                    ELSE 'Pendiente Geolocalización'
                END as categoria,
                count(*)::int as cantidad
            FROM data_avance
            GROUP BY 1
        ),
        cte_por_zonas AS (
            SELECT 
                zona_id,
                count(*)::int as total,
                SUM(CASE WHEN actualizacion_completa THEN 1 ELSE 0 END)::int as completados,
                SUM(CASE WHEN NOT actualizacion_completa THEN 1 ELSE 0 END)::int as pendientes
            FROM data_avance
            GROUP BY 1
            ORDER BY total DESC
        ),
        cte_distribucion_tarifas AS (
            SELECT 
                COALESCE(ct.nombre, 'Sin tarifa asignada') as tarifa,
                count(a.acometida_id)::int as cantidad
            FROM public.acometida a
            LEFT JOIN public.tarifa t ON t.tarifa_id = a.tarifa_id
            LEFT JOIN public.categoria ct ON ct.categoria_id = t.categoria_id
            GROUP BY ct.nombre
            ORDER BY cantidad DESC
        ),
        cte_metricas_acometida AS (
            -- ESCANEO ÚNICO A LA TABLA ACOMETIDA
            SELECT 
                -- Cobertura de Alcantarillado
                COALESCE(SUM(CASE WHEN a.alcantarillado = true THEN 1 ELSE 0 END), 0)::int as con_alcantarillado,
                COALESCE(SUM(CASE WHEN a.alcantarillado = false OR a.alcantarillado IS NULL THEN 1 ELSE 0 END), 0)::int as sin_alcantarillado,
                
                -- Calidad GPS (precisión)
                COALESCE(ROUND(AVG(CASE WHEN a.precision > 0 THEN a.precision ELSE NULL END)::numeric, 2), 0)::float as precision_promedio,
                
                -- Cobertura de Medidores
                SUM(CASE WHEN a.numero_medidor IS NOT NULL AND a.numero_medidor != '' AND UPPER(a.numero_medidor) != 'S/M' THEN 1 ELSE 0 END)::int as con_medidor,
                SUM(CASE WHEN a.numero_medidor IS NULL OR a.numero_medidor = '' OR UPPER(a.numero_medidor) = 'S/M' THEN 1 ELSE 0 END)::int as sin_medidor,
                
                -- Estado de la Red (Activas vs Inactivas)
                SUM(CASE WHEN est.permite_lectura = TRUE  THEN 1 ELSE 0 END)::int as activas,
                SUM(CASE WHEN est.permite_lectura = FALSE THEN 1 ELSE 0 END)::int as inactivas,
                
                -- Población Servida
                COALESCE(SUM(CASE WHEN est.permite_lectura = TRUE THEN a.numero_personas ELSE 0 END), 0)::int as total_habitantes
            FROM public.acometida a
            LEFT JOIN public.cat_estados_acometida est ON a.estado_id = est.id_estado
        ),
        cte_instalaciones_recientes AS (
            SELECT 
                coordenadas,
                fecha_instalacion as fecha
            FROM public.acometida
            WHERE fecha_instalacion >= date_trunc('year', now())
              AND coordenadas IS NOT NULL
            LIMIT 100
        ),
        cte_curva_crecimiento AS (
            SELECT 
                to_char(fecha_instalacion, 'YYYY-MM') as mes,
                count(*)::int as nuevas_acometidas
            FROM public.acometida
            WHERE fecha_instalacion IS NOT NULL
              AND fecha_instalacion >= now() - INTERVAL '12 months'
            GROUP BY 1
            ORDER BY 1 ASC
        ),
        cte_embudo AS (
            -- EMBUDO DE CALIDAD
            SELECT 
                count(*)::int as total_acometidas,
                SUM(CASE WHEN a.predio_clave_catastral IS NOT NULL THEN 1 ELSE 0 END)::int as con_predio,
                SUM(da.cliente_actualizado::int)::int as con_cliente,
                SUM(da.actualizacion_completa::int)::int as completa
            FROM public.acometida a
            JOIN data_avance da ON a.acometida_id = da.acometida_id
        ),
        cte_por_sectores AS (
            -- 2. DESGLOSE DE AVANCE DETALLADO POR SECTOR (camelCase en JSON)
            SELECT
                a.sector,
                COUNT(*)::int as total,
                SUM(CASE WHEN da.actualizacion_completa THEN 1 ELSE 0 END)::int as "totalActualizadas",
                SUM(CASE WHEN NOT da.actualizacion_completa THEN 1 ELSE 0 END)::int as pendientes,
                ROUND(AVG(da.actualizacion_completa::int) * 100, 1)::float as porcentaje,
                -- Auditoría detallada: qué falta georreferenciar/cargar por sector
                SUM(CASE WHEN NOT da.acometida_actualizada THEN 1 ELSE 0 END)::int as "sinGeolocalizacion",
                SUM(CASE WHEN NOT da.predio_actualizado THEN 1 ELSE 0 END)::int as "sinPredio",
                SUM(CASE WHEN NOT da.cliente_actualizado THEN 1 ELSE 0 END)::int as "sinCliente"
            FROM public.acometida a
            JOIN data_avance da ON a.acometida_id = da.acometida_id
            GROUP BY a.sector
            ORDER BY a.sector ASC
        )
        SELECT jsonb_build_object(
            'resumen', (SELECT to_jsonb(r) FROM cte_resumen r),
            
            'historico', COALESCE((SELECT jsonb_agg(h) FROM cte_historico h), '[]'::jsonb),
            
            'distribucion', COALESCE((SELECT jsonb_agg(d) FROM cte_distribucion d), '[]'::jsonb),
            
            'porZonas', COALESCE((SELECT jsonb_agg(z) FROM cte_por_zonas z), '[]'::jsonb),
            
            'distribucionTarifas', COALESCE((SELECT jsonb_agg(dt) FROM cte_distribucion_tarifas dt), '[]'::jsonb),
            
            'coberturaAlcantarillado', (
                SELECT jsonb_build_object(
                    'con_alcantarillado', con_alcantarillado,
                    'sin_alcantarillado', sin_alcantarillado
                ) FROM cte_metricas_acometida
            ),
            
            'calidadGps', (
                SELECT jsonb_build_object(
                    'precision_promedio', precision_promedio
                ) FROM cte_metricas_acometida
            ),
            
            'instalacionesRecientesCoords', COALESCE((SELECT jsonb_agg(irc) FROM cte_instalaciones_recientes irc), '[]'::jsonb),
            
            'curvaCrecimiento', COALESCE((SELECT jsonb_agg(cc) FROM cte_curva_crecimiento cc), '[]'::jsonb),
            
            'poblacionServida', (
                SELECT jsonb_build_object(
                    'total_habitantes', total_habitantes
                ) FROM cte_metricas_acometida
            ),
            
            'coberturaMedidores', (
                SELECT jsonb_build_object(
                    'con_medidor', con_medidor,
                    'sin_medidor', sin_medidor
                ) FROM cte_metricas_acometida
            ),
            
            'estadoRed', (
                SELECT jsonb_build_object(
                    'activas', activas,
                    'inactivas', inactivas
                ) FROM cte_metricas_acometida
            ),
            
            'embudo', (
                SELECT jsonb_build_array(
                    jsonb_build_object('paso', '1. Total Acometidas', 'total', total_acometidas),
                    jsonb_build_object('paso', '2. Con Predio Vinculado', 'total', con_predio),
                    jsonb_build_object('paso', '3. Con Cliente Validado', 'total', con_cliente),
                    jsonb_build_object('paso', '4. Actualización Completa', 'total', completa)
                ) FROM cte_embudo
            ),
            
            -- Agregamos la colección por sectores con formato limpio
            'porSectores', COALESCE((SELECT jsonb_agg(s) FROM cte_por_sectores s), '[]'::jsonb)
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

  async getLiveUpdateMapConnections(): Promise<LiveMapConnectionResponse[]> {
    try {
      const query = `
        SELECT 
          a.acometida_id AS connection_id,
          a.clave_catastral AS cadastral_key,
          COALESCE(CONCAT(ci.nombres, ' ', ci.apellidos), e.razon_social, 'Sin Nombre') AS client_name,
          a.direccion AS address,
          a.sector,
          a.zona_id,
          -- 1. Extracción numérica directa de coordenadas (PostGIS)
          public.ST_Y(a.coordenadas) AS latitude,
          public.ST_X(a.coordenadas) AS longitude,
          -- 2. Fecha de geolocalización o última modificación global
          COALESCE(da.ultima_modificacion_global, a.fecha_geolocalizacion) AS last_updated,
          -- 3. Clasificación en vivo del avance
          CASE 
              WHEN da.actualizacion_completa THEN 'Completado (Full)'
              WHEN NOT da.cliente_actualizado THEN 'Pendiente Datos Cliente'
              WHEN NOT da.predio_actualizado THEN 'Pendiente Ficha Predial'
              ELSE 'Pendiente Geolocalización'
          END AS status_category,
          -- 4. Color semántico profesional para los marcadores en el mapa
          CASE 
              WHEN da.actualizacion_completa THEN '#10b981'  -- Verde (Completado)
              WHEN NOT da.cliente_actualizado THEN '#f59e0b' -- Naranja (Falta Cliente)
              WHEN NOT da.predio_actualizado THEN '#3b82f6'  -- Azul (Falta Predio)
              ELSE '#ef4444'                                  -- Rojo (Falta GPS)
          END AS marker_color
      FROM public.acometida a
      JOIN public.cliente c ON a.cliente_id = c.cliente_id
      LEFT JOIN public.ciudadano ci ON c.cliente_id = ci.ciudadano_id
      LEFT JOIN public.empresa e ON c.cliente_id = e.ruc
      JOIN public.vw_avance_actualizacion_acometidas da ON a.acometida_id = da.acometida_id
      WHERE a.coordenadas IS NOT NULL 
        -- 5. Filtrar coordenadas vacías o basura en 0,0 (evita que se rendericen en el mar cerca de África)
        AND NOT (public.ST_Y(a.coordenadas) = 0 AND public.ST_X(a.coordenadas) = 0)
      ORDER BY last_updated DESC;
      `;
      const result =
        await this.databaseService.query<LiveMapConnectionSqlResponse>(
          query,
          [],
        );
      return result.map((connection) =>
        ConnectionSqlAdapter.toResponse(connection),
      );
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
            a.zona_id as "zone_id",
            a.zona_code as "zone_code",
            a.zona_name as "zone_name",
            COALESCE(count(CASE WHEN im.estado <> 'RESUELTO' THEN 1 END ), 0) as incidents,
            a.tipo_acometida as "connection_type",
            pct.nombre as "connection_type_name"
        FROM acometida a INNER JOIN cliente c ON c.cliente_id = a.cliente_id
        INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        LEFT JOIN incidente_medidor im ON a.acometida_id = im.acometida_id
        LEFT JOIN acometidas.tipo_acometida pct ON a.tipo_acometida = pct.codigo
        WHERE a.acometida_id = ?
        GROUP BY a.acometida_id, a.cliente_id, a.tarifa_id, ct.nombre, a.numero_medidor, a.sector,
                a.cuenta, a.clave_catastral, a.numero_contrato, a.alcantarillado, a.estado_id,
                est.nombre, est.permite_lectura, a.direccion, a.fecha_instalacion, a.numero_personas,
                a.zona, a.coordenadas, a.referencia, a.metadata, a.altitud, a.precision, a.fecha_geolocalizacion,
                a.zona_geometrica, a.predio_clave_catastral, a.zona_id, a.zona_code, a.zona_name,
                a.tipo_acometida, pct.nombre
        ORDER BY a.created_at DESC, a.acometida_id;
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
          a.zona_id as "zone_id",
          a.zona_code as "zone_code",
          a.zona_name as "zone_name",
          COALESCE(count(CASE WHEN im.estado <> 'RESUELTO' THEN 1 END ), 0) as incidents,
          a.tipo_acometida as "connection_type",
          pct.nombre as "connection_type_name"
      FROM acometida a
      INNER JOIN cliente c ON c.cliente_id = a.cliente_id
      INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
      INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
      LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
      LEFT JOIN public.incidente_medidor im on a.acometida_id = im.acometida_id
      LEFT JOIN acometidas.tipo_acometida pct ON a.tipo_acometida = pct.codigo
      WHERE a.sector = ?
      GROUP BY a.acometida_id, a.cliente_id, a.tarifa_id, ct.nombre, a.numero_medidor, a.sector,
                a.cuenta, a.clave_catastral, a.numero_contrato, a.alcantarillado, a.estado_id,
                est.nombre, est.permite_lectura, a.direccion, a.fecha_instalacion, a.numero_personas,
                a.zona, a.coordenadas, a.referencia, a.metadata, a.altitud, a.precision, a.fecha_geolocalizacion,
                a.zona_geometrica, a.predio_clave_catastral, a.zona_id, a.zona_code, a.zona_name,
                a.tipo_acometida, pct.nombre
      ORDER BY a.created_at DESC,a.acometida_id
      LIMIT ? OFFSET ?;
    `;
      const params: (string | number)[] = [sector, limit, offset];
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
          a.zona_id as "zone_id",
          a.zona_code as "zone_code",
          a.zona_name as "zone_name",
          COALESCE(count(CASE WHEN im.estado <> 'RESUELTO' THEN 1 END ), 0) as incidents,
          a.tipo_acometida as "connection_type",
          pct.nombre as "connection_type_name"
      FROM acometida a
      INNER JOIN cliente c ON c.cliente_id = a.cliente_id
      INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
      INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
      LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
      LEFT JOIN public.incidente_medidor im on a.acometida_id = im.acometida_id
      LEFT JOIN acometidas.tipo_acometida pct ON a.tipo_acometida = pct.codigo
      WHERE a.cliente_id = ?
      GROUP BY a.acometida_id, a.cliente_id, a.tarifa_id, pct.nombre, a.numero_medidor, a.sector,
                a.cuenta, a.clave_catastral, a.numero_contrato, a.alcantarillado, a.estado_id,
                est.nombre, est.permite_lectura, a.direccion, a.fecha_instalacion, a.numero_personas,
                a.zona, a.coordenadas, a.referencia, a.metadata, a.altitud, a.precision, a.fecha_geolocalizacion,
                a.zona_geometrica, a.predio_clave_catastral, a.zona_id, a.zona_code, a.zona_name,
                a.tipo_acometida, pct.nombre, ct.nombre
      ORDER BY a.created_at DESC,a.acometida_id
      LIMIT ? OFFSET ?;
    `;
      const params: (string | number)[] = [clientId, limit, offset];
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
            a.zona_id as "zone_id",
            a.zona_code as "zone_code",
            a.zona_name as "zone_name",
            COALESCE(count(CASE WHEN im.estado <> 'RESUELTO' THEN 1 END ), 0) as incidents,
            a.tipo_acometida as "connection_type",
            pct.nombre as "connection_type_name"
        FROM acometida a
        INNER JOIN cliente c ON c.cliente_id = a.cliente_id
        INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        LEFT JOIN public.incidente_medidor im on a.acometida_id = im.acometida_id
        LEFT JOIN acometidas.tipo_acometida pct ON a.tipo_acometida = pct.codigo
        group by a.acometida_id, a.cliente_id, a.tarifa_id, pct.nombre, a.numero_medidor, a.sector,
                a.cuenta, a.clave_catastral, a.numero_contrato, a.alcantarillado, a.estado_id,
                est.nombre, est.permite_lectura, a.direccion, a.fecha_instalacion, a.numero_personas,
                a.zona, a.coordenadas, a.referencia, a.metadata, a.altitud, a.precision, a.fecha_geolocalizacion,
                a.zona_geometrica, a.predio_clave_catastral, a.zona_id, a.created_at,
                a.tipo_acometida, pct.nombre, ct.nombre
        ORDER BY a.created_at DESC,a.acometida_id
        LIMIT ? OFFSET ?;
      `;
      const params: number[] = [limit, offset];
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
      return await this.databaseService.transaction(
        async (client: IDatabaseClient) => {
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
          zona_id as "zone_id",
          '' as "zone_code",
          '' as "zone_name",
          0 AS incidents,
          tipo_acometida as "connection_type",
          '' as "connection_type_name"
          ;
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

          const result = await client.query<ConnectionSqlResponse>(
            query,
            params,
          );
          if (result.length === 0) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message: `Failed to create connection.`,
            });
          }
          const created = result[0];

          // Registra el medidor inicial en el historial dentro de la misma transacción
          await this.meterHistoryRecorder.recordMeterChange(client, {
            connectionId: created.connection_id,
            clientId: created.client_id ?? connection.getClientId() ?? null,
            previousMeterNumber: null,
            newMeterNumber: created.connection_meter_number ?? null,
            operation: 'INSERT',
          });

          return ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
            created,
          );
        },
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
      return await this.databaseService.transaction(
        async (client: IDatabaseClient) => {
          // Bloquea la fila y captura el medidor previo antes de actualizar
          const currentRows = await client.query<{
            numero_medidor: string | null;
          }>(
            `SELECT numero_medidor FROM acometida WHERE acometida_id = ? FOR UPDATE`,
            [connectionId],
          );
          if (currentRows.length === 0) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message: `Failed to update connection with ID ${connectionId}.`,
            });
          }
          const previousMeterNumber = currentRows[0].numero_medidor;

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
          predio_clave_catastral = ?,
          zona_id = COALESCE(?, zona_id)
        WHERE acometida_id = ?
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
          zona_id as "zone_id",
          '' as "zone_code",
          '' as "zone_name",
          0 AS incidents,
          tipo_acometida as "connection_type",
          '' as "connection_type_name";
      `;
          const params: any[] = [
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
            connectionId,
          ];

          const result = await client.query<ConnectionSqlResponse>(
            query,
            params,
          );
          if (result.length === 0) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message: `Failed to update connection with ID ${connectionId}.`,
            });
          }
          const updated = result[0];

          // Registra el cambio de medidor en el historial dentro de la misma transacción
          await this.meterHistoryRecorder.recordMeterChange(client, {
            connectionId,
            clientId: updated.client_id ?? connection.getClientId() ?? null,
            previousMeterNumber,
            newMeterNumber: updated.connection_meter_number ?? null,
            operation: 'UPDATE',
          });

          return ConnectionSqlAdapter.fromConnectionSqlResponseToConnectionResponse(
            updated,
          );
        },
      );
    } catch (error) {
      throw error;
    }
  }

  async findConnectionAndPropertyByCadastralKey(
    cadastralKey: string,
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
        LEFT JOIN predio p         ON p.clave_catastral = a.predio_clave_catastral
        LEFT JOIN ciudadano ci     ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e        ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc ON cc.cliente_id = c.cliente_id
        INNER JOIN tarifa t        ON t.tarifa_id = a.tarifa_id
        LEFT JOIN categoria ct ON t.categoria_id = ct.categoria_id
        LEFT JOIN tipo_predio tp    ON tp.tipo_predio_id = p.tipo_predio_id
        INNER JOIN public.zona z    ON z.zona_id = a.zona_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        WHERE a.acometida_id = ?;
      `;
      const params: string[] = [cadastralKey];
      const result =
        await this.databaseService.query<ConnectionAndPropertySqlResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection found for property cadastral key ${cadastralKey}`,
        });
      }

      return ConnectionSqlAdapter.fromConnectionAndPropertySqlResponseToConnectionAndPropertyResponse(
        result[0],
      );
    } catch (error) {
      throw error;
    }
  }

  async findConnectionAndPropertyByCadastralKeyOrCardId(
    searchValue: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionAndPropertyResponse[]> {
    try {
      const query: string = `
        SELECT
            -- Connection Data
            a.acometida_id                AS "connection_id",
            a.cliente_id                  AS "client_id",
            a.tarifa_id                   AS "connection_rate_id",
            ct.nombre                     AS "connection_rate_name",
            a.numero_medidor              AS "connection_meter_number",
            hm.numero_medidor_nuevo       AS "connection_meter_number_current",
            hm.numero_medidor_anterior    AS "connection_meter_number_preview",
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
            a.tipo_acometida              AS "connection_type",
            cta.nombre                     AS "connection_type_name",
            (
              SELECT COUNT(*)
              FROM public.incidente_medidor sub_im
              WHERE sub_im.acometida_id = a.acometida_id
                AND (sub_im.estado IS NULL OR sub_im.estado <> 'RESUELTO')
            ) AS incidents,
            -- Client Data
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
            CASE
                WHEN a.predio_clave_catastral IS NOT NULL THEN
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
                ELSE NULL
            END AS "property",
              -- Ultimas 10 lecturas
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'cadastral_key', sub_lr.clave_catastral,
                        'reading_date', sub_lr.fecha_lectura,
                        'reading_time', sub_lr.hora_lectura,
                        'reading_month', sub_lr.mes_lectura,
                        'reading_value_current', sub_lr.lectura_actual,
                        'reading_value_preview', sub_lr.lectura_anterior,
                        'novelty', sub_lr.novedad
                    ) ORDER BY sub_lr.fecha_lectura DESC, sub_lr.hora_lectura DESC NULLS LAST, sub_lr.lectura_id DESC
                )
                FROM (
                    SELECT lr.clave_catastral, lr.fecha_lectura, lr.hora_lectura, lr.mes_lectura,
                        lr.lectura_actual, lr.lectura_anterior, lr.novedad, lr.lectura_id
                    FROM public.lectura lr
                    WHERE lr.acometida_id = a.acometida_id AND lr.fecha_lectura IS NOT NULL
                    ORDER BY lr.fecha_lectura DESC, lr.hora_lectura DESC NULLS LAST, lr.lectura_id DESC
                    LIMIT 10
                ) sub_lr
            ) AS "last_readings"
        FROM acometida a
        INNER JOIN cliente c       ON c.cliente_id = a.cliente_id
        LEFT JOIN predio p         ON p.clave_catastral = a.predio_clave_catastral
        LEFT JOIN ciudadano ci     ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e        ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc ON cc.cliente_id = c.cliente_id
        INNER JOIN tarifa t        ON t.tarifa_id = a.tarifa_id
        LEFT JOIN categoria ct ON t.categoria_id = ct.categoria_id
        LEFT JOIN tipo_predio tp    ON tp.tipo_predio_id = p.tipo_predio_id
        INNER JOIN public.zona z    ON z.zona_id = a.zona_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        LEFT JOIN acometidas.tipo_acometida cta ON a.tipo_acometida = cta.codigo
        LEFT JOIN LATERAL (
            SELECT sub_hm.numero_medidor_nuevo, sub_hm.numero_medidor_anterior
            FROM public.historial_medidores sub_hm
            WHERE sub_hm.id_acometida = a.acometida_id
            ORDER BY sub_hm.estado ASC, sub_hm.fecha_instalacion DESC
            LIMIT 1
        ) hm ON TRUE
        WHERE a.acometida_id = ? OR a.cliente_id = ? OR a.numero_medidor = ?
        LIMIT ? OFFSET ?;
      `;
      const params: (string | number)[] = [
        searchValue,
        searchValue,
        searchValue,
        limit,
        offset,
      ];
      const result =
        await this.databaseService.query<ConnectionAndPropertySqlResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No connection found for search value ${searchValue}`,
        });
      }

      return result.map((row) =>
        ConnectionSqlAdapter.fromConnectionAndPropertySqlResponseToConnectionAndPropertyResponse(
          row,
        ),
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
            cat.nombre                     AS "connection_rate_name",
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
            a.tipo_acometida              AS "connection_type",
            cta.nombre                     AS "connection_type_name",
            (
              SELECT COUNT(*)
              FROM public.incidente_medidor sub_im
              WHERE sub_im.acometida_id = a.acometida_id
                AND (sub_im.estado IS NULL OR sub_im.estado <> 'RESUELTO')
            ) AS incidents,
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
            ) AS "properties",
              -- Ultimas 10 lecturas
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'cadastral_key', sub_lr.clave_catastral,
                        'reading_date', sub_lr.fecha_lectura,
                        'reading_time', sub_lr.hora_lectura,
                        'reading_month', sub_lr.mes_lectura,
                        'reading_value_current', sub_lr.lectura_actual,
                        'reading_value_preview', sub_lr.lectura_anterior,
                        'novelty', sub_lr.novedad
                    ) ORDER BY sub_lr.fecha_lectura DESC, sub_lr.hora_lectura DESC NULLS LAST, sub_lr.lectura_id DESC
                )
                FROM (
                    SELECT lr.clave_catastral, lr.fecha_lectura, lr.hora_lectura, lr.mes_lectura,
                      lr.lectura_actual, lr.lectura_anterior, lr.novedad, lr.lectura_id
                    FROM public.lectura lr
                    WHERE lr.acometida_id = a.acometida_id AND lr.fecha_lectura IS NOT NULL
                    ORDER BY lr.fecha_lectura DESC, lr.hora_lectura DESC NULLS LAST, lr.lectura_id DESC
                    LIMIT 10
                ) sub_lr
            ) AS "last_readings"

        FROM acometida a
        INNER JOIN cliente c           ON c.cliente_id = a.cliente_id
        LEFT JOIN ciudadano ci         ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e            ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc  ON cc.cliente_id = c.cliente_id
        INNER JOIN tarifa t            ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria cat ON t.categoria_id = cat.categoria_id
        INNER JOIN public.zona z on z.zona_id = a.zona_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        LEFT JOIN acometidas.tipo_acometida cta ON cta.codigo = a.tipo_acometida
        
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

      const querySql: string = /*sql*/ `
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
            a.tipo_acometida              AS "connection_type",
            cta.nombre                     AS "connection_type_name",
            (
              SELECT COUNT(*)
              FROM public.incidente_medidor sub_im
              WHERE sub_im.acometida_id = a.acometida_id
                AND (sub_im.estado IS NULL OR sub_im.estado <> 'RESUELTO')
            ) AS incidents,
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
            END AS "person",
              -- Ultimas 10 lecturas
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'cadastral_key', sub_lr.clave_catastral,
                        'reading_date', sub_lr.fecha_lectura,
                        'reading_time', sub_lr.hora_lectura,
                        'reading_month', sub_lr.mes_lectura,
                        'reading_value_current', sub_lr.lectura_actual,
                        'reading_value_preview', sub_lr.lectura_anterior,
                        'novelty', sub_lr.novedad
                    ) ORDER BY sub_lr.fecha_lectura DESC, sub_lr.hora_lectura DESC NULLS LAST, sub_lr.lectura_id DESC
                )
                FROM (
                    SELECT lr.clave_catastral, lr.fecha_lectura, lr.hora_lectura, lr.mes_lectura,
                      lr.lectura_actual, lr.lectura_anterior, lr.novedad, lr.lectura_id
                    FROM public.lectura lr
                    WHERE lr.acometida_id = a.acometida_id AND lr.fecha_lectura IS NOT NULL
                    ORDER BY lr.fecha_lectura DESC, lr.hora_lectura DESC NULLS LAST, lr.lectura_id DESC
                    LIMIT 10
                ) sub_lr
            ) AS "last_readings"

        FROM acometida a
        INNER JOIN cliente c           ON c.cliente_id = a.cliente_id
        LEFT JOIN ciudadano ci         ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e            ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc  ON cc.cliente_id = c.cliente_id
        INNER JOIN tarifa t            ON t.tarifa_id = a.tarifa_id
        INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
        INNER JOIN public.zona z       ON z.zona_id = a.zona_id
        LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
        LEFT JOIN acometidas.tipo_acometida cta ON cta.codigo = a.tipo_acometida
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
    limit,
    offset,
    query,
    hasIncidents,
    status,
    sewerage,
    hasCoordinates,
    searchField,
  }: {
    limit: number;
    offset: number;
    query?: string;
    hasIncidents?: 'yes' | 'no';
    status?: string;
    sewerage?: 'yes' | 'no';
    hasCoordinates?: 'yes' | 'no';
    searchField?: string;
  }): Promise<ConnectionResponse[]> {
    try {
      const whereConditions: string[] = [];
      const paramsQuery: any[] = [];
      let paramCounter = 1;

      // ── Filtro de texto libre ─────────────────────────────────────────────
      if (query && query.trim()) {
        const q = `%${query.trim()}%`;

        if (searchField && searchField !== 'all') {
          const fieldMap: Record<string, string> = {
            connectionCadastralKey: 'a.clave_catastral',
            connectionMeterNumber: 'a.numero_medidor',
            connectionAddress: 'a.direccion',
            clientId: 'a.cliente_id::text',
            connectionSector: 'a.sector::text',
            connectionAccount: 'a.cuenta::text',
            connectionContractNumber: 'a.numero_contrato',
            connectionReference: 'a.referencia',
          };
          const dbField = fieldMap[searchField];
          if (dbField) {
            whereConditions.push(`${dbField} ILIKE $${paramCounter}`);
            paramsQuery.push(q);
            paramCounter++;
          } else {
            whereConditions.push(`(
              a.clave_catastral ILIKE $${paramCounter} OR
              a.numero_medidor ILIKE $${paramCounter} OR
              a.direccion ILIKE $${paramCounter} OR
              a.cliente_id::text ILIKE $${paramCounter} OR
              a.sector::text ILIKE $${paramCounter} OR
              a.cuenta::text ILIKE $${paramCounter} OR
              ci.nombres ILIKE $${paramCounter} OR
              ci.apellidos ILIKE $${paramCounter} OR
              e.razon_social ILIKE $${paramCounter} OR
              e.nombre_comercial ILIKE $${paramCounter}
            )`);
            paramsQuery.push(q);
            paramCounter++;
          }
        } else {
          whereConditions.push(`(
            a.clave_catastral ILIKE $${paramCounter} OR
            a.numero_medidor ILIKE $${paramCounter} OR
            a.direccion ILIKE $${paramCounter} OR
            a.cliente_id::text ILIKE $${paramCounter} OR
            a.sector::text ILIKE $${paramCounter} OR
            a.cuenta::text ILIKE $${paramCounter} OR
            ci.nombres ILIKE $${paramCounter} OR
            ci.apellidos ILIKE $${paramCounter} OR
            e.razon_social ILIKE $${paramCounter} OR
            e.nombre_comercial ILIKE $${paramCounter}
          )`);
          paramsQuery.push(q);
          paramCounter++;
        }
      }

      // ── Filtro de estado (permite_lectura o nombre) ───────────────────────
      if (status && status.trim()) {
        let correctStatus: string =
          status.trim().toUpperCase() === 'ACTIVE' ? 'ACTIVA' : '';
        if (correctStatus) {
          whereConditions.push(`est.nombre = $${paramCounter}`);
          paramsQuery.push(correctStatus);
        } else {
          correctStatus = 'ACTIVA';
          whereConditions.push(`est.nombre <> $${paramCounter}`);
          paramsQuery.push(correctStatus);
        }
        paramCounter++;
      }

      // ── Filtro de alcantarillado ──────────────────────────────────────────
      if (sewerage === 'yes') {
        whereConditions.push(`a.alcantarillado = TRUE`);
      } else if (sewerage === 'no') {
        whereConditions.push(
          `a.alcantarillado = FALSE OR a.alcantarillado IS NULL`,
        );
      }

      if (hasCoordinates === 'yes') {
        whereConditions.push(`a.coordenadas IS NOT NULL`);
      } else if (hasCoordinates === 'no') {
        whereConditions.push(`a.coordenadas IS NULL`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      // ── HAVING: filtro sobre el agregado incidents (COUNT) ────────────────
      // No puede ir en WHERE porque incidents es resultado de GROUP BY.
      let havingClause = '';
      if (hasIncidents === 'yes') {
        havingClause = `HAVING COALESCE(count(CASE WHEN im.estado <> 'RESUELTO' THEN 1 END), 0) > 0`;
      } else if (hasIncidents === 'no') {
        havingClause = `HAVING COALESCE(count(CASE WHEN im.estado <> 'RESUELTO' THEN 1 END), 0) = 0`;
      }

      const sql = /*sql*/ `
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
        z.nombre AS "zone_name",
        (
          SELECT COUNT(*)
          FROM public.incidente_medidor sub_im
          WHERE sub_im.acometida_id = a.acometida_id
            AND (sub_im.estado IS NULL OR sub_im.estado <> 'RESUELTO')
        ) AS incidents,
        a.tipo_acometida AS "connection_type",
        pct.nombre AS "connection_type_name"
      FROM acometida a
      INNER JOIN cliente c ON c.cliente_id = a.cliente_id
      LEFT JOIN ciudadano ci ON ci.ciudadano_id = c.cliente_id
      LEFT JOIN empresa e ON e.ruc = c.cliente_id
      INNER JOIN tarifa t ON t.tarifa_id = a.tarifa_id
      INNER JOIN categoria ct ON t.categoria_id = ct.categoria_id
      LEFT JOIN public.zona z ON z.zona_id = a.zona_id
      LEFT JOIN cat_estados_acometida est ON a.estado_id = est.id_estado
      LEFT JOIN public.incidente_medidor im ON a.acometida_id = im.acometida_id
      LEFT JOIN acometidas.tipo_acometida pct ON pct.codigo = a.tipo_acometida
      ${whereClause}
      GROUP BY
        a.acometida_id, a.cliente_id, a.tarifa_id, ct.nombre, a.numero_medidor, a.sector,
        a.cuenta, a.clave_catastral, a.numero_contrato, a.alcantarillado, a.estado_id,
        est.nombre, est.permite_lectura, a.direccion, a.fecha_instalacion, a.numero_personas,
        a.zona, a.coordenadas, a.referencia, a.metadata, a.altitud, a.precision, a.fecha_geolocalizacion,
        a.zona_geometrica, a.predio_clave_catastral, a.zona_id, z.codigo, z.nombre,
        a.tipo_acometida, pct.nombre
      ${havingClause}
      ORDER BY a.updated_at DESC, a.acometida_id
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

      console.log('SQL Query:', whereClause);

      paramsQuery.push(limit, offset);

      const result = await this.databaseService.query<ConnectionSqlResponse>(
        sql,
        paramsQuery,
      );

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
        LEFT JOIN public.usuarios u ON u.usuario_id = h.usuario_id
        WHERE h.acometida_id = ?
        ORDER BY h.fecha_cambio DESC
        LIMIT ? OFFSET ?;
      `;

      const result =
        await this.databaseService.query<ConnectionStateHistoryResponse>(
          query,
          [connectionId, limit, offset],
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
          limit,
          offset,
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

  async findPropertyWithClientByCadastralKeyOrCardIdOrLikeName(
    searchValue: string,
    limit: number,
    offset: number,
  ): Promise<PropertyWithClientResponse[]> {
    try {
      const likeSearchValue = `%${searchValue}%`;
      const query: string = `
        SELECT
          p.predio_id AS "property_id",
          p.clave_catastral AS "property_cadastral_key",
          p.callejon AS "property_alleyway",
          p.sector AS "property_sector",
          p.direccion AS "property_address",
          p.coordenadas::text AS "property_coordinates",
          p.referencia AS "property_reference",
          p.altitud AS "property_altitude",
          p.precision AS "property_precision",
          p.zona_geometrica AS "property_geometric_zone",
          tp.tipo_predio_id AS "property_type_id",
          tp.nombre AS "property_type_name",
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
        FROM predio p
        LEFT JOIN tipo_predio tp ON tp.tipo_predio_id = p.tipo_predio_id
        INNER JOIN cliente c ON c.cliente_id = p.cliente_id
        LEFT JOIN ciudadano ci ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN empresa e ON e.ruc = c.cliente_id
        LEFT JOIN cliente_contacto cc ON cc.cliente_id = c.cliente_id
        WHERE p.clave_catastral = ?
          OR c.cliente_id = ?
          OR CONCAT_WS(' ', ci.nombres, ci.apellidos) ILIKE ?
          OR e.nombre_comercial ILIKE ?
          OR e.razon_social ILIKE ?
        ORDER BY p.predio_id
        LIMIT ? OFFSET ?;
      `;
      const params: any[] = [
        searchValue,
        searchValue,
        likeSearchValue,
        likeSearchValue,
        likeSearchValue,
        limit,
        offset,
      ];
      const result =
        await this.databaseService.query<PropertyWithClientSqlResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No property found for search value ${searchValue}`,
        });
      }

      return result.map((row) =>
        ConnectionSqlAdapter.fromPropertyWithClientSqlResponseToPropertyWithClientResponse(
          row,
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  async getDashboardConnectionsByClientId(
    clientId: string,
  ): Promise<ConnectionDashboardResponse[]> {
    try {
      const query = `
        select * from view_dashboard_acometidas where client_id = ?;
      `;
      const params: any[] = [clientId];
      const result =
        await this.databaseService.query<ConnectionDashboardSqlResult>(
          query,
          params,
        );

      const dashboardResponses: ConnectionDashboardResponse[] = result.map(
        (row) => DashboardViewAdapter.toConnectionDashboardResponse(row),
      );

      return dashboardResponses;
    } catch (error) {
      throw error;
    }
  }

  async getDashboardGlobalClientId(
    clientId: string,
  ): Promise<ClientDashboardResponse | null> {
    try {
      const query = `
        select * from view_dashboard_clientes where client_id = ?;
      `;
      const params: any[] = [clientId];
      const result = await this.databaseService.query<ClientDashboardSqlResult>(
        query,
        params,
      );

      if (result.length === 0) {
        return null;
      }

      const dashboardResponse: ClientDashboardResponse =
        DashboardViewAdapter.toClientDashboardResponse(result[0]);

      return dashboardResponse;
    } catch (error) {
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // METER CHANGE
  // ─────────────────────────────────────────────────────────────────

  async registerMeterChange(
    connectionId: string,
    changeDetail: MeterChangeDetail,
    photos: UploadedMeterChangePhoto[],
  ): Promise<MeterChangeResponse> {
    try {
      return await this.databaseService.transaction(
        async (client: IDatabaseClient) => {
          const newMeterNumber =
            changeDetail.medidor_nuevo.numero_medidor?.trim();
          if (!newMeterNumber) {
            throw new RpcException({
              statusCode: statusCode.BAD_REQUEST,
              message: 'medidor_nuevo.numero_medidor es obligatorio.',
            });
          }

          // Bloquea la fila y captura el medidor/cliente actuales antes de actualizar
          const currentRows = await client.query<{
            numero_medidor: string | null;
            cliente_id: string | null;
          }>(
            `SELECT numero_medidor, cliente_id FROM acometida WHERE acometida_id = ? FOR UPDATE`,
            [connectionId],
          );
          if (currentRows.length === 0) {
            throw new RpcException({
              statusCode: statusCode.NOT_FOUND,
              message: `Connection ${connectionId} not found.`,
            });
          }
          const previousMeterNumber = currentRows[0].numero_medidor;
          const clientId = currentRows[0].cliente_id;

          if (
            previousMeterNumber &&
            previousMeterNumber.trim() === newMeterNumber
          ) {
            throw new RpcException({
              statusCode: statusCode.CONFLICT,
              message: `El número de medidor ${newMeterNumber} ya está asignado a esta acometida.`,
            });
          }

          const updateRows = await client.query<{ numero_medidor: string }>(
            `UPDATE acometida SET numero_medidor = ?, updated_at = NOW() WHERE acometida_id = ? RETURNING numero_medidor`,
            [newMeterNumber, connectionId],
          );
          if (updateRows.length === 0) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message: `Failed to update meter number for connection ${connectionId}.`,
            });
          }

          const historialMedidorId =
            await this.meterHistoryRecorder.recordMeterChange(client, {
              connectionId,
              clientId,
              previousMeterNumber,
              newMeterNumber,
              operation: 'UPDATE',
              changeDetails: changeDetail,
            });
          if (!historialMedidorId) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message:
                'No se pudo registrar el cambio de medidor en el historial.',
            });
          }

          for (const photo of photos) {
            await client.query(
              `INSERT INTO public.foto_cambio_medidor (historial_medidor_id, imagen_url, descripcion) VALUES (?, ?, ?)`,
              [historialMedidorId, photo.fileUrl, photo.description ?? null],
            );
          }

          return {
            connectionId,
            previousMeterNumber,
            newMeterNumber,
            historialMedidorId,
            photos: photos.map((photo) => ({
              imageUrl: photo.fileUrl,
              description: photo.description ?? null,
            })),
          };
        },
      );
    } catch (error) {
      throw error;
    }
  }
}
