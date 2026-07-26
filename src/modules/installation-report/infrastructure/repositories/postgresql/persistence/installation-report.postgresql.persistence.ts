import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInstallationReportRepository } from '../../../../domain/contracts/installation-report.interface.repository';
import { InstallationReportModel } from '../../../../domain/schemas/models/InstallationReportModel';
import { InstallationReportResponse } from '../../../../domain/schemas/dto/response/installation-response';
import { SqlViewInstallationReport } from '../../../interfaces/sql/sql-result';
import { WorkOrderInstallationViewAdapter } from '../../../adapters/views-adapter';

@Injectable()
export class InstallationReportPostgreSQLPersistence implements InterfaceInstallationReportRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async createInstallationReport(
    report: InstallationReportModel,
  ): Promise<InstallationReportModel | null> {
    // First find the solicitud id
    const solResult = await this.databaseService.query<{
      id_solicitud: string;
    }>(
      `SELECT id_solicitud FROM acometidas.solicitud_orden_trabajo WHERE id_orden_trabajo = $1`,
      [report.workOrderId],
    );
    const solicitudId = solResult.length > 0 ? solResult[0].id_solicitud : null;
    if (!solicitudId) return null;

    const result = await this.databaseService.query<any>(
      `INSERT INTO acometidas.informe_instalacion (
         id_orden_trabajo, id_solicitud, resultado, 
         numero_medidor, lectura_inicial, sello_seguridad, diametro_conexion, geom_medidor,
         condiciones_finales, observaciones, firma_cliente
       ) VALUES ($1::uuid, $2::uuid, $3::text, $4::text, $5::numeric, $6::text, $7::text,
         CASE WHEN NULLIF($8::text, '') IS NULL THEN NULL ELSE ST_GeomFromText($8::text, 4326) END,
         $9::text, $10::text, $11::text)
       ON CONFLICT (id_orden_trabajo) DO UPDATE SET
         resultado = EXCLUDED.resultado,
         numero_medidor = EXCLUDED.numero_medidor,
         lectura_inicial = EXCLUDED.lectura_inicial,
         sello_seguridad = EXCLUDED.sello_seguridad,
         diametro_conexion = EXCLUDED.diametro_conexion,
         geom_medidor = EXCLUDED.geom_medidor,
         condiciones_finales = EXCLUDED.condiciones_finales,
         observaciones = EXCLUDED.observaciones,
         firma_cliente = EXCLUDED.firma_cliente,
         updated_at = NOW()
       RETURNING *`,
      [
        report.workOrderId,
        solicitudId,
        report.result,
        report.meterNumber,
        report.initialReading,
        report.securitySeal,
        report.connectionDiameter,
        report.geomMeter,
        report.finalConditions,
        report.observations,
        report.clientSignatureUrl,
      ],
    );
    if (result.length === 0) return null;
    const r = result[0];
    return new InstallationReportModel(
      r.id_informe,
      r.id_orden_trabajo,
      r.id_solicitud,
      r.resultado,
      r.fecha_instalacion,
      r.numero_medidor,
      r.lectura_inicial,
      r.sello_seguridad,
      r.diametro_conexion,
      r.geom_medidor, // Note: returning geometry as hex/wkb, usually it's better to fetch ST_AsText but it's ok
      r.condiciones_finales,
      r.observaciones,
      r.firma_cliente,
      r.aprobado,
      r.id_aprobador,
      r.fecha_aprobacion,
      r.created_at,
      r.updated_at,
    );
  }

  async getReportByWorkOrderId(
    workOrderId: string,
  ): Promise<InstallationReportModel | null> {
    const result = await this.databaseService.query<any>(
      `SELECT * FROM acometidas.informe_instalacion WHERE id_orden_trabajo = $1`,
      [workOrderId],
    );
    if (result.length === 0) return null;
    const r = result[0];
    return new InstallationReportModel(
      r.id_informe,
      r.id_orden_trabajo,
      r.id_solicitud,
      r.resultado,
      r.fecha_instalacion,
      r.numero_medidor,
      r.lectura_inicial,
      r.sello_seguridad,
      r.diametro_conexion,
      r.geom_medidor,
      r.condiciones_finales,
      r.observaciones,
      r.firma_cliente,
      r.aprobado,
      r.id_aprobador,
      r.fecha_aprobacion,
      r.created_at,
      r.updated_at,
    );
  }

  async approveInstallationReport(
    reportId: string,
    approved: boolean,
    approverId: string,
  ): Promise<{ solicitudId: string } | null> {
    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `UPDATE acometidas.informe_instalacion
       SET aprobado = $1, id_aprobador = $2,
           fecha_aprobacion = NOW(), updated_at = NOW()
       WHERE id_informe = $3
       RETURNING id_solicitud`,
      [approved, approverId, reportId],
    );
    return result.length > 0 ? { solicitudId: result[0].id_solicitud } : null;
  }

  async changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void> {
    await this.databaseService.query(
      `SELECT acometidas.fn_cambiar_estado_solicitud($1::uuid, $2::text, $3::uuid, $4::text, '{}'::jsonb)`,
      [solicitudId, newStatus, userId, comment],
    );
  }

  async closeWorkOrder(
    workOrderId: string,
    completedStatus: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService.transaction(async (client) => {
      const res = await client.query<{ estado: string }>(
        `SELECT estado FROM work_orders.orden_trabajo WHERE id_orden_trabajo = $1`,
        [workOrderId],
      );
      const currentState = res[0]?.estado;

      await client.query(
        `UPDATE work_orders.orden_trabajo
         SET estado = $2, fecha_completada = NOW(), updated_at = NOW()
         WHERE id_orden_trabajo = $1`,
        [workOrderId, completedStatus],
      );

      await client.query(
        `INSERT INTO work_orders.historial_estado_orden_trabajo (
           id_orden_trabajo, estado_anterior, estado_nuevo, id_usuario, descripcion_cambio
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          workOrderId,
          currentState,
          completedStatus,
          userId,
          'Trabajo técnico finalizado en campo',
        ],
      );
    });
  }

  async getClientIdBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ id_cliente: string }>(
      `SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].id_cliente : null;
  }

  async getWorkOrderInstallationDetailByOrderCodeOrRequestNumber(
    orderCodeOrRequestNumber: string,
  ): Promise<InstallationReportResponse | null> {
    const result = await this.databaseService.query<SqlViewInstallationReport>(
      `
      SELECT * FROM work_orders.view_informe_instalacion
            WHERE order_code = $1 OR request_number = $1;
      `,
      [orderCodeOrRequestNumber],
    );
    if (result.length === 0) return null;
    return WorkOrderInstallationViewAdapter.mapInstallationViewToResponse(
      result[0],
    );
  }
}
