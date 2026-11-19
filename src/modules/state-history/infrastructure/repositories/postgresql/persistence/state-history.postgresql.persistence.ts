import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  DatabaseAbstract,
  IDatabaseClient,
} from '../../../../../../shared/connections/database/abstract/abstract.database';
import {
  InterfaceStateHistoryRepository,
  StateHistoryFilterCriteria,
  CurrentConnectionStateInfo,
  StateHistoryGeoEventItem,
  ConnectionCadastralDetails,
} from '../../../../domain/contracts/state-history.interface.repository';
import { StateHistoryModel } from '../../../../domain/schemas/models/state-history.model';
import { StateCatalogModel } from '../../../../domain/schemas/models/state-catalog.model';
import { StateSummaryModel } from '../../../../domain/schemas/models/state-summary.model';
import { ConnectionByStateItemModel } from '../../../../domain/schemas/models/connection-by-state.model';
import {
  StateHistorySQLResult,
  StateCatalogSQLResult,
  StateSummarySQLResult,
  ConnectionByStateSQLResult,
  CurrentConnectionStateSQLResult,
} from '../../../interfaces/sql/state-history.sql.result';
import { StateHistoryAdapter } from '../../../adapters/state-history.adapter';
import { statusCode } from '../../../../../../settings/environments/status-code';

@Injectable()
export class StateHistoryPostgreSQLPersistence implements InterfaceStateHistoryRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  private getBaseSelectQuery(): string {
    return `
      SELECT
        h.historial_id,
        h.acometida_id,
        h.estado_anterior_id,
        h.estado_nuevo_id,
        h.fecha_cambio,
        h.fecha_efectiva,
        h.motivo,
        h.documento_respaldo,
        h.id_documento,
        h.observaciones,
        h.usuario_id,
        h.origen,
        h.ip_origen,
        h.dispositivo_id,
        CASE WHEN h.ubicacion_evento IS NOT NULL THEN ST_Y(h.ubicacion_evento) ELSE NULL END AS latitude,
        CASE WHEN h.ubicacion_evento IS NOT NULL THEN ST_X(h.ubicacion_evento) ELSE NULL END AS longitude,
        h.es_reverso,
        h.historial_origen_id,
        h.created_at,
        c_ant.nombre AS estado_anterior_nombre,
        c_nue.nombre AS estado_nuevo_nombre,
        c_nue.permite_facturar,
        c_nue.permite_lectura,
        c_nue.requiere_inspeccion,
        u.email AS usuario_email,
        u.username AS usuario_nombre_completo
      FROM acometidas.acometida_estado_historial h
      LEFT JOIN public.cat_estados_acometida c_ant ON c_ant.id_estado = h.estado_anterior_id
      JOIN public.cat_estados_acometida c_nue ON c_nue.id_estado = h.estado_nuevo_id
      LEFT JOIN public.usuarios u ON u.usuario_id = h.usuario_id
    `;
  }

  async createStateHistory(
    entry: StateHistoryModel,
  ): Promise<StateHistoryModel> {
    try {
      const isUUID =
        entry.idDocumento ||
        (entry.supportDocument &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          entry.supportDocument,
        )
          ? entry.supportDocument
          : null);

      const insertSql = `
        INSERT INTO acometidas.acometida_estado_historial (
          acometida_id,
          estado_anterior_id,
          estado_nuevo_id,
          fecha_cambio,
          fecha_efectiva,
          motivo,
          documento_respaldo,
          id_documento,
          observaciones,
          usuario_id,
          origen,
          ip_origen,
          dispositivo_id,
          ubicacion_evento,
          es_reverso,
          historial_origen_id
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8::uuid,
          $9,
          $10::uuid,
          $11,
          $12::inet,
          $13,
          CASE
            WHEN $14::double precision IS NOT NULL AND $15::double precision IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint($15::double precision, $14::double precision), 4326)
            ELSE NULL
          END,
          $16,
          $17
        )
        RETURNING historial_id;
      `;

      const params = [
        entry.connectionId,
        entry.previousStateId,
        entry.newStateId,
        entry.changeDate,
        entry.effectiveDate,
        entry.reason,
        entry.supportDocument,
        isUUID,
        entry.observations,
        entry.userId,
        entry.origin,
        entry.ipAddress,
        entry.deviceId,
        entry.location?.latitude ?? null,
        entry.location?.longitude ?? null,
        entry.isReversal,
        entry.originHistoryId,
      ];

      const insertResult = await this.databaseService.query<{
        historial_id: string | number;
      }>(insertSql, params);
      if (insertResult.length === 0) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to insert state history record',
        });
      }

      const generatedId = Number(insertResult[0].historial_id);
      const fullRecord = await this.findById(generatedId);
      if (!fullRecord) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Could not fetch newly created state history record',
        });
      }

      return fullRecord;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Database error creating state history: ${(error as Error).message}`,
      });
    }
  }

  async bulkCreateStateHistory(
    entries: StateHistoryModel[],
  ): Promise<StateHistoryModel[]> {
    if (entries.length === 0) return [];

    try {
      return await this.databaseService.transaction(
        async (client: IDatabaseClient) => {
          const createdRecords: StateHistoryModel[] = [];

          // 1. Order canonical IDs and lock connections in strict alphabetical order to avoid deadlocks
          const connectionIds = entries.map((e) => e.connectionId);
          await client.query(
            `SELECT acometida_id FROM public.acometida WHERE acometida_id = ANY($1) ORDER BY acometida_id FOR UPDATE`,
            [connectionIds],
          );

          // 2. Perform bulk insertions
          for (const entry of entries) {
            const isUUID =
              entry.idDocumento ||
              (entry.supportDocument &&
              /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                entry.supportDocument,
              )
                ? entry.supportDocument
                : null);

            const insertSql = `
            INSERT INTO acometidas.acometida_estado_historial (
              acometida_id,
              estado_anterior_id,
              estado_nuevo_id,
              fecha_cambio,
              fecha_efectiva,
              motivo,
              documento_respaldo,
              id_documento,
              observaciones,
              usuario_id,
              origen,
              ip_origen,
              dispositivo_id,
              ubicacion_evento,
              es_reverso,
              historial_origen_id
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8::uuid, $9, $10::uuid, $11, $12::inet, $13, NULL, $14, $15
            )
            RETURNING historial_id;
          `;

            const params = [
              entry.connectionId,
              entry.previousStateId,
              entry.newStateId,
              entry.changeDate,
              entry.effectiveDate,
              entry.reason,
              entry.supportDocument,
              isUUID,
              entry.observations,
              entry.userId,
              entry.origin,
              entry.ipAddress,
              entry.deviceId,
              entry.isReversal,
              entry.originHistoryId,
            ];

            const res = await client.query<{ historial_id: string | number }>(
              insertSql,
              params,
            );
            if (res.length > 0) {
              const insertedId = Number(res[0].historial_id);
              createdRecords.push(
                new StateHistoryModel(
                  insertedId,
                  entry.connectionId,
                  entry.previousStateId,
                  entry.newStateId,
                  entry.changeDate,
                  entry.effectiveDate,
                  entry.reason,
                  entry.supportDocument,
                  entry.observations,
                  entry.userId,
                  entry.origin,
                  entry.ipAddress,
                  entry.deviceId,
                  null,
                  entry.isReversal,
                  entry.originHistoryId,
                  entry.createdAt,
                ),
              );
            }
          }

          return createdRecords;
        },
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Bulk state change transaction failed: ${(error as Error).message}`,
      });
    }
  }

  async findById(historialId: number): Promise<StateHistoryModel | null> {
    try {
      const sql = `${this.getBaseSelectQuery()} WHERE h.historial_id = $1 LIMIT 1;`;
      const rows = await this.databaseService.query<StateHistorySQLResult>(
        sql,
        [historialId],
      );
      if (rows.length === 0) return null;
      return StateHistoryAdapter.fromSQLToModel(rows[0]);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying state history by ID: ${(error as Error).message}`,
      });
    }
  }

  async findByConnectionId(
    connectionId: string,
    limit: number,
    offset: number,
  ): Promise<StateHistoryModel[]> {
    try {
      const sql = `
        ${this.getBaseSelectQuery()}
        WHERE h.acometida_id = $1
        ORDER BY h.fecha_efectiva DESC, h.historial_id DESC
        LIMIT $2 OFFSET $3;
      `;
      const rows = await this.databaseService.query<StateHistorySQLResult>(
        sql,
        [connectionId, limit, offset],
      );
      return rows.map((r) => StateHistoryAdapter.fromSQLToModel(r));
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying connection state history: ${(error as Error).message}`,
      });
    }
  }

  async countByConnectionId(connectionId: string): Promise<number> {
    try {
      const sql = `SELECT COUNT(*)::int AS total FROM acometidas.acometida_estado_historial WHERE acometida_id = $1;`;
      const res = await this.databaseService.query<{ total: number }>(sql, [
        connectionId,
      ]);
      return res.length > 0 ? Number(res[0].total) : 0;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error counting connection history: ${(error as Error).message}`,
      });
    }
  }

  async findCurrentStateByConnectionId(
    connectionId: string,
  ): Promise<CurrentConnectionStateInfo | null> {
    try {
      const sql = `
        SELECT
          a.acometida_id,
          a.estado_id,
          est.nombre AS estado_nombre,
          est.descripcion,
          est.permite_facturar,
          est.permite_lectura,
          est.requiere_inspeccion,
          a.estado AS estado_legacy,
          last_h.fecha_efectiva AS ultimo_cambio_fecha,
          last_h.motivo AS ultimo_motivo,
          last_h.origen AS ultimo_origen
        FROM public.acometida a
        JOIN public.cat_estados_acometida est ON est.id_estado = a.estado_id
        LEFT JOIN LATERAL (
          SELECT fecha_efectiva, motivo, origen
          FROM acometidas.acometida_estado_historial h
          WHERE h.acometida_id = a.acometida_id
          ORDER BY h.fecha_efectiva DESC, h.historial_id DESC
          LIMIT 1
        ) last_h ON TRUE
        WHERE a.acometida_id = $1 OR a.clave_catastral = $1
        LIMIT 1;
      `;

      const rows =
        await this.databaseService.query<CurrentConnectionStateSQLResult>(sql, [
          connectionId,
        ]);
      if (rows.length === 0) return null;
      return StateHistoryAdapter.fromCurrentStateSQLToInfo(rows[0]);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying current connection state: ${(error as Error).message}`,
      });
    }
  }

  async revertStateHistory(
    originHistorialId: number,
    reversalEntry: StateHistoryModel,
  ): Promise<StateHistoryModel> {
    try {
      return await this.databaseService.transaction(
        async (client: IDatabaseClient) => {
          // 1. Lock the connection deterministically
          await client.query(
            `SELECT acometida_id FROM public.acometida WHERE acometida_id = $1 FOR UPDATE;`,
            [reversalEntry.connectionId],
          );

          // 2. Insert the reversal entry
          const insertSql = `
          INSERT INTO acometidas.acometida_estado_historial (
            acometida_id,
            estado_anterior_id,
            estado_nuevo_id,
            fecha_cambio,
            fecha_efectiva,
            motivo,
            documento_respaldo,
            observaciones,
            usuario_id,
            origen,
            ip_origen,
            dispositivo_id,
            ubicacion_evento,
            es_reverso,
            historial_origen_id
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9::uuid,
            $10,
            $11::inet,
            $12,
            CASE
              WHEN $13::double precision IS NOT NULL AND $14::double precision IS NOT NULL
              THEN ST_SetSRID(ST_MakePoint($14::double precision, $13::double precision), 4326)
              ELSE NULL
            END,
            TRUE,
            $15
          )
          RETURNING historial_id;
        `;

          const params = [
            reversalEntry.connectionId,
            reversalEntry.previousStateId,
            reversalEntry.newStateId,
            reversalEntry.changeDate,
            reversalEntry.effectiveDate,
            reversalEntry.reason,
            reversalEntry.supportDocument,
            reversalEntry.observations,
            reversalEntry.userId,
            reversalEntry.origin,
            reversalEntry.ipAddress,
            reversalEntry.deviceId,
            reversalEntry.location?.latitude ?? null,
            reversalEntry.location?.longitude ?? null,
            originHistorialId,
          ];

          const res = await client.query<{ historial_id: string | number }>(
            insertSql,
            params,
          );
          if (res.length === 0) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message: 'Failed to insert reversal state history record',
            });
          }

          const generatedId = Number(res[0].historial_id);
          const querySql = `${this.getBaseSelectQuery()} WHERE h.historial_id = $1 LIMIT 1;`;
          const fetchedRows = await client.query<StateHistorySQLResult>(
            querySql,
            [generatedId],
          );
          if (fetchedRows.length === 0) {
            throw new RpcException({
              statusCode: statusCode.INTERNAL_SERVER_ERROR,
              message: 'Could not fetch reverted record details',
            });
          }

          return StateHistoryAdapter.fromSQLToModel(fetchedRows[0]);
        },
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Reversal transaction failed: ${(error as Error).message}`,
      });
    }
  }

  async findLatestReversibleByConnectionId(
    connectionId: string,
  ): Promise<StateHistoryModel | null> {
    try {
      const sql = `
        ${this.getBaseSelectQuery()}
        WHERE h.acometida_id = $1
          AND h.es_reverso = FALSE
          AND NOT EXISTS (
            SELECT 1 FROM acometidas.acometida_estado_historial rev
            WHERE rev.historial_origen_id = h.historial_id
          )
        ORDER BY h.fecha_efectiva DESC, h.historial_id DESC
        LIMIT 1;
      `;
      const rows = await this.databaseService.query<StateHistorySQLResult>(
        sql,
        [connectionId],
      );
      if (rows.length === 0) return null;
      return StateHistoryAdapter.fromSQLToModel(rows[0]);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying latest reversible record: ${(error as Error).message}`,
      });
    }
  }

  async findGeoEvents(
    stateId?: number,
    sectorId?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StateHistoryGeoEventItem[]> {
    try {
      const conditions: string[] = ['h.ubicacion_evento IS NOT NULL'];
      const params: (number | string | Date)[] = [];

      if (stateId !== undefined && stateId !== null && stateId > 0) {
        params.push(stateId);
        conditions.push(`h.estado_nuevo_id = $${params.length}`);
      }

      if (sectorId !== undefined && sectorId !== null && sectorId > 0) {
        params.push(sectorId);
        conditions.push(`a.sector = $${params.length}`);
      }

      if (startDate) {
        params.push(startDate);
        conditions.push(`h.fecha_efectiva >= $${params.length}`);
      }

      if (endDate) {
        params.push(endDate);
        conditions.push(`h.fecha_efectiva <= $${params.length}`);
      }

      const sql = `
        SELECT
          h.historial_id,
          h.acometida_id,
          a.sector,
          h.estado_nuevo_id AS state_id,
          est.nombre AS state_name,
          h.fecha_efectiva,
          h.motivo,
          h.documento_respaldo,
          ST_AsGeoJSON(h.ubicacion_evento)::json AS geojson
        FROM acometidas.acometida_estado_historial h
        JOIN public.acometida a ON a.acometida_id = h.acometida_id
        JOIN public.cat_estados_acometida est ON est.id_estado = h.estado_nuevo_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY h.fecha_efectiva DESC
        LIMIT 500;
      `;

      interface GeoEventSQLRow {
        historial_id: number | string;
        acometida_id: string;
        sector: number | null;
        state_id: number;
        state_name: string;
        fecha_efectiva: string | Date;
        motivo: string | null;
        documento_respaldo: string | null;
        geojson: Record<string, unknown>;
      }

      const rows = await this.databaseService.query<GeoEventSQLRow>(
        sql,
        params,
      );
      return rows.map((r) => ({
        historialId: Number(r.historial_id),
        connectionId: r.acometida_id,
        sector: r.sector !== null ? Number(r.sector) : null,
        stateId: Number(r.state_id),
        stateName: r.state_name,
        effectiveDate: new Date(r.fecha_efectiva),
        reason: r.motivo,
        supportDocument: r.documento_respaldo,
        geoJson: r.geojson,
      }));
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying geo events: ${(error as Error).message}`,
      });
    }
  }

  async findConnectionsByState(
    stateId: number,
    sectorId?: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ConnectionByStateItemModel[]> {
    try {
      const conditions: string[] = ['a.estado_id = $1'];
      const params: (number | string)[] = [stateId];

      if (sectorId !== undefined && sectorId !== null && sectorId > 0) {
        params.push(sectorId);
        conditions.push(`a.sector = $${params.length}`);
      }

      params.push(limit);
      const limitParamIdx = params.length;

      params.push(offset);
      const offsetParamIdx = params.length;

      const sql = `
        SELECT
          a.acometida_id,
          a.cuenta,
          a.clave_catastral,
          a.numero_contrato,
          a.sector AS sector_id,
          a.estado_id,
          est.nombre AS estado_nombre,
          a.estado AS estado_legacy,
          COALESCE(
            ci.nombres || ' ' || ci.apellidos,
            e.razon_social,
            'Sin nombre'
          ) AS cliente_nombre,
          COALESCE(c.cliente_id, ci.ciudadano_id, e.ruc) AS cliente_identificacion,
          last_h.fecha_efectiva AS ultimo_cambio_estado
        FROM public.acometida a
        JOIN public.cat_estados_acometida est ON est.id_estado = a.estado_id
        LEFT JOIN public.cliente c ON c.cliente_id = a.cliente_id
        LEFT JOIN public.ciudadano ci ON ci.ciudadano_id = c.cliente_id
        LEFT JOIN public.empresa e ON e.ruc = c.cliente_id
        LEFT JOIN LATERAL (
          SELECT fecha_efectiva
          FROM acometidas.acometida_estado_historial h
          WHERE h.acometida_id = a.acometida_id
          ORDER BY h.fecha_efectiva DESC, h.historial_id DESC
          LIMIT 1
        ) last_h ON TRUE
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.acometida_id ASC
        LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx};
      `;

      const rows = await this.databaseService.query<ConnectionByStateSQLResult>(
        sql,
        params,
      );
      return rows.map((r) =>
        StateHistoryAdapter.fromConnectionByStateSQLToModel(r),
      );
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying connections by state: ${(error as Error).message}`,
      });
    }
  }

  async countConnectionsByState(
    stateId: number,
    sectorId?: number,
  ): Promise<number> {
    try {
      const conditions: string[] = ['estado_id = $1'];
      const params: (number | string)[] = [stateId];

      if (sectorId !== undefined && sectorId !== null && sectorId > 0) {
        params.push(sectorId);
        conditions.push(`sector = $${params.length}`);
      }

      const sql = `SELECT COUNT(*)::int AS total FROM public.acometida WHERE ${conditions.join(' AND ')};`;
      const res = await this.databaseService.query<{ total: number }>(
        sql,
        params,
      );
      return res.length > 0 ? Number(res[0].total) : 0;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error counting connections by state: ${(error as Error).message}`,
      });
    }
  }

  async getStateCatalog(): Promise<StateCatalogModel[]> {
    try {
      const sql = `
        SELECT
          id_estado,
          nombre,
          descripcion,
          permite_facturar,
          requiere_inspeccion,
          permite_lectura
        FROM public.cat_estados_acometida
        ORDER BY id_estado ASC;
      `;
      const rows = await this.databaseService.query<StateCatalogSQLResult>(sql);
      return rows.map((r) => StateHistoryAdapter.fromCatalogSQLToModel(r));
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying state catalog: ${(error as Error).message}`,
      });
    }
  }

  async getStateCatalogById(
    stateId: number,
  ): Promise<StateCatalogModel | null> {
    try {
      const sql = `
        SELECT
          id_estado,
          nombre,
          descripcion,
          permite_facturar,
          requiere_inspeccion,
          permite_lectura
        FROM public.cat_estados_acometida
        WHERE id_estado = $1
        LIMIT 1;
      `;
      const rows = await this.databaseService.query<StateCatalogSQLResult>(
        sql,
        [stateId],
      );
      if (rows.length === 0) return null;
      return StateHistoryAdapter.fromCatalogSQLToModel(rows[0]);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error querying catalog item ${stateId}: ${(error as Error).message}`,
      });
    }
  }

  async getStateSummary(): Promise<StateSummaryModel[]> {
    try {
      const sql = `
        WITH totales AS (
          SELECT COUNT(*)::numeric AS gran_total FROM public.acometida
        )
        SELECT
          c.id_estado,
          c.nombre,
          c.descripcion,
          COUNT(a.acometida_id)::bigint AS total_acometidas,
          CASE
            WHEN t.gran_total > 0 THEN ROUND((COUNT(a.acometida_id)::numeric / t.gran_total) * 100, 2)
            ELSE 0
          END AS porcentaje,
          c.permite_facturar,
          c.permite_lectura,
          c.requiere_inspeccion
        FROM public.cat_estados_acometida c
        CROSS JOIN totales t
        LEFT JOIN public.acometida a ON a.estado_id = c.id_estado
        GROUP BY c.id_estado, c.nombre, c.descripcion, c.permite_facturar, c.permite_lectura, c.requiere_inspeccion, t.gran_total
        ORDER BY c.id_estado ASC;
      `;

      const rows = await this.databaseService.query<StateSummarySQLResult>(sql);
      return rows.map((r) => StateHistoryAdapter.fromSummarySQLToModel(r));
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error calculating state summary dashboard: ${(error as Error).message}`,
      });
    }
  }

  async findFiltered(
    filter: StateHistoryFilterCriteria,
  ): Promise<{ items: StateHistoryModel[]; total: number }> {
    try {
      const conditions: string[] = ['1=1'];
      const params: (string | number | boolean | Date)[] = [];

      if (filter.connectionId) {
        params.push(filter.connectionId);
        conditions.push(`h.acometida_id = $${params.length}`);
      }

      if (filter.stateId) {
        params.push(filter.stateId);
        conditions.push(`h.estado_nuevo_id = $${params.length}`);
      }

      if (filter.userId) {
        params.push(filter.userId);
        conditions.push(`h.usuario_id = $${params.length}::uuid`);
      }

      if (filter.origin) {
        params.push(filter.origin);
        conditions.push(`h.origen = $${params.length}`);
      }

      if (filter.startDate) {
        params.push(filter.startDate);
        conditions.push(`h.fecha_efectiva >= $${params.length}`);
      }

      if (filter.endDate) {
        params.push(filter.endDate);
        conditions.push(`h.fecha_efectiva <= $${params.length}`);
      }

      if (typeof filter.isReversal === 'boolean') {
        params.push(filter.isReversal);
        conditions.push(`h.es_reverso = $${params.length}`);
      }

      const whereClause = conditions.join(' AND ');

      // Count query
      const countSql = `SELECT COUNT(*)::int AS total FROM acometidas.acometida_estado_historial h WHERE ${whereClause};`;
      const countRes = await this.databaseService.query<{ total: number }>(
        countSql,
        params,
      );
      const total = countRes.length > 0 ? Number(countRes[0].total) : 0;

      // Data query with limit & offset
      const limit = filter.limit ?? 50;
      const offset = filter.offset ?? 0;

      params.push(limit);
      const limitIdx = params.length;

      params.push(offset);
      const offsetIdx = params.length;

      const dataSql = `
        ${this.getBaseSelectQuery()}
        WHERE ${whereClause}
        ORDER BY h.fecha_efectiva DESC, h.historial_id DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx};
      `;

      const rows = await this.databaseService.query<StateHistorySQLResult>(
        dataSql,
        params,
      );
      const items = rows.map((r) => StateHistoryAdapter.fromSQLToModel(r));

      return { items, total };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: `Error filtering state history: ${(error as Error).message}`,
      });
    }
  }

  async verifyConnectionExists(connectionId: string): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM public.acometida WHERE acometida_id = $1 OR clave_catastral = $1 LIMIT 1;`;
      const res = await this.databaseService.query(sql, [connectionId]);
      return res.length > 0;
    } catch (error) {
      return false;
    }
  }

  async verifyStateExists(stateId: number): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM public.cat_estados_acometida WHERE id_estado = $1 LIMIT 1;`;
      const res = await this.databaseService.query(sql, [stateId]);
      return res.length > 0;
    } catch (error) {
      return false;
    }
  }

  async verifyReversalExists(originHistoryId: number): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM acometidas.acometida_estado_historial WHERE historial_origen_id = $1 AND es_reverso = TRUE LIMIT 1;`;
      const res = await this.databaseService.query(sql, [originHistoryId]);
      return res.length > 0;
    } catch (error) {
      return false;
    }
  }

  async findCadastralDetailsByConnectionId(
    connectionId: string,
  ): Promise<ConnectionCadastralDetails | null> {
    try {
      const sql = `
      SELECT 
        acometida_id AS "connectionId",
        sector,
        cuenta AS account,
        clave_catastral AS "cadastralKey"
      FROM public.acometida
      WHERE acometida_id = $1 OR clave_catastral = $1
      LIMIT 1;
    `;
      const rows = await this.databaseService.query<ConnectionCadastralDetails>(
        sql,
        [connectionId],
      );
      if (rows.length > 0) {
        return rows[0];
      }
      if (connectionId && connectionId.includes('-')) {
        const [sectorStr, accountStr] = connectionId.split('-');
        const sector = Number(sectorStr);
        const account = Number(accountStr);
        if (!isNaN(sector) && !isNaN(account)) {
          return {
            connectionId,
            sector,
            account,
            cadastralKey: connectionId,
          };
        }
      }
      return null;
    } catch (error) {
      console.error(
        `Error buscando datos catastrales para ${connectionId}: ${(error as Error).message}`,
      );
      if (connectionId && connectionId.includes('-')) {
        const [sectorStr, accountStr] = connectionId.split('-');
        const sector = Number(sectorStr);
        const account = Number(accountStr);
        if (!isNaN(sector) && !isNaN(account)) {
          return {
            connectionId,
            sector,
            account,
            cadastralKey: connectionId,
          };
        }
      }
      return null;
    }
  }
}
