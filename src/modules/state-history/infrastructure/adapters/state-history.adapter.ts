import { StateHistoryModel } from '../../domain/schemas/models/state-history.model';
import { StateCatalogModel } from '../../domain/schemas/models/state-catalog.model';
import { StateSummaryModel } from '../../domain/schemas/models/state-summary.model';
import { ConnectionByStateItemModel } from '../../domain/schemas/models/connection-by-state.model';
import { CurrentConnectionStateInfo } from '../../domain/contracts/state-history.interface.repository';
import { StateHistoryOriginEnum } from '../../domain/enums/state-history.enums';
import {
  StateHistorySQLResult,
  StateCatalogSQLResult,
  StateSummarySQLResult,
  ConnectionByStateSQLResult,
  CurrentConnectionStateSQLResult,
} from '../interfaces/sql/state-history.sql.result';

export class StateHistoryAdapter {
  public static fromSQLToModel(row: StateHistorySQLResult): StateHistoryModel {
    const hasLocation =
      row.latitude !== null &&
      row.latitude !== undefined &&
      row.longitude !== null &&
      row.longitude !== undefined;

    const parsedOrigin = Object.values(StateHistoryOriginEnum).includes(row.origen as StateHistoryOriginEnum)
      ? (row.origen as StateHistoryOriginEnum)
      : StateHistoryOriginEnum.WEB;

    return new StateHistoryModel(
      typeof row.historial_id === 'string' ? Number(row.historial_id) : row.historial_id,
      row.acometida_id,
      row.estado_anterior_id !== null ? Number(row.estado_anterior_id) : null,
      Number(row.estado_nuevo_id),
      new Date(row.fecha_cambio),
      new Date(row.fecha_efectiva),
      row.motivo,
      row.documento_respaldo,
      row.observaciones,
      row.usuario_id,
      parsedOrigin,
      row.ip_origen,
      row.dispositivo_id,
      hasLocation
        ? {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
          }
        : null,
      Boolean(row.es_reverso),
      row.historial_origen_id !== null && row.historial_origen_id !== undefined
        ? Number(row.historial_origen_id)
        : null,
      new Date(row.created_at),
      row.estado_anterior_nombre ?? null,
      row.estado_nuevo_nombre ?? null,
      row.permite_facturar !== undefined ? Boolean(row.permite_facturar) : null,
      row.permite_lectura !== undefined ? Boolean(row.permite_lectura) : null,
      row.requiere_inspeccion !== undefined ? Boolean(row.requiere_inspeccion) : null,
      row.usuario_email ?? null,
      row.usuario_nombre_completo ?? null,
      row.id_documento ?? null,
    );
  }

  public static fromCatalogSQLToModel(row: StateCatalogSQLResult): StateCatalogModel {
    return new StateCatalogModel(
      Number(row.id_estado),
      row.nombre,
      row.descripcion,
      Boolean(row.permite_facturar),
      Boolean(row.requiere_inspeccion),
      Boolean(row.permite_lectura),
    );
  }

  public static fromSummarySQLToModel(row: StateSummarySQLResult): StateSummaryModel {
    return new StateSummaryModel(
      Number(row.id_estado),
      row.nombre,
      row.descripcion,
      Number(row.total_acometidas),
      Number(row.porcentaje),
      Boolean(row.permite_facturar),
      Boolean(row.permite_lectura),
      Boolean(row.requiere_inspeccion),
    );
  }

  public static fromConnectionByStateSQLToModel(row: ConnectionByStateSQLResult): ConnectionByStateItemModel {
    return new ConnectionByStateItemModel(
      row.acometida_id,
      row.cuenta,
      row.clave_catastral,
      row.numero_contrato,
      row.sector_id !== null ? Number(row.sector_id) : null,
      Number(row.estado_id),
      row.estado_nombre,
      Boolean(row.estado_legacy),
      row.cliente_nombre,
      row.cliente_identificacion,
      row.ultimo_cambio_estado ? new Date(row.ultimo_cambio_estado) : null,
    );
  }

  public static fromCurrentStateSQLToInfo(row: CurrentConnectionStateSQLResult): CurrentConnectionStateInfo {
    return {
      connectionId: row.acometida_id,
      stateId: Number(row.estado_id),
      stateName: row.estado_nombre,
      description: row.descripcion,
      allowsBilling: Boolean(row.permite_facturar),
      allowsReading: Boolean(row.permite_lectura),
      requiresInspection: Boolean(row.requiere_inspeccion),
      isActiveLegacy: Boolean(row.estado_legacy),
      lastChangedAt: row.ultimo_cambio_fecha ? new Date(row.ultimo_cambio_fecha) : null,
      lastReason: row.ultimo_motivo,
      lastOrigin: row.ultimo_origen,
    };
  }
}
