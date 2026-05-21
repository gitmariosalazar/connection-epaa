import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInspectionReportRepository } from '../../../../domain/contracts/inspection-report.interface.repository';
import { InspectionReportModel } from '../../../../domain/schemas/models/InspectionReportModel';

@Injectable()
export class InspectionReportPostgreSQLPersistence implements InterfaceInspectionReportRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async createInspectionReport(report: InspectionReportModel): Promise<InspectionReportModel | null> {
    const result = await this.databaseService.query<any>(
      `INSERT INTO acometidas.informe_inspeccion (
         id_orden_trabajo, id_solicitud, resultado, distancia_red_m,
         diametro_conexion, condiciones_terreno, observaciones, geom_acometida,
         costo_materiales, costo_mano_obra
       ) VALUES ($1, $2, $3, $4, $5, $6, $7,
         CASE WHEN $8 IS NULL THEN NULL ELSE ST_GeomFromText($8, 4326) END,
         $9, $10)
       RETURNING
         id_informe AS report_id, id_orden_trabajo AS work_order_id,
         id_solicitud AS solicitud_id, resultado AS result,
         costo_materiales AS material_cost, costo_mano_obra AS labor_cost,
         costo_total AS total_cost, created_at, updated_at`,
      [
        report.workOrderId, report.solicitudId, report.result,
        report.networkDistanceM, report.connectionDiameter,
        report.terrainConditions, report.observations,
        report.geomAcometida, report.materialCost, report.laborCost,
      ],
    );
    if (result.length === 0) return null;
    const r = result[0];
    return new InspectionReportModel(
      r.report_id, r.work_order_id, r.solicitud_id, r.result,
      null, null, null, null, null, r.material_cost, r.labor_cost,
      null, null, null, null, r.created_at, r.updated_at,
    );
  }

  async approveInspectionReport(
    reportId: string, approved: boolean, rejectionReason: string | null, approverId: string,
  ): Promise<{ solicitudId: string } | null> {
    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `UPDATE acometidas.informe_inspeccion
       SET aprobado = $1, motivo_rechazo = $2, id_aprobador = $3,
           fecha_aprobacion = NOW(), updated_at = NOW()
       WHERE id_informe = $4
       RETURNING id_solicitud`,
      [approved, rejectionReason, approverId, reportId],
    );
    return result.length > 0 ? { solicitudId: result[0].id_solicitud } : null;
  }

  async getReportByWorkOrderId(workOrderId: string): Promise<InspectionReportModel | null> {
    const result = await this.databaseService.query<any>(
      `SELECT id_informe AS report_id, id_orden_trabajo AS work_order_id,
              id_solicitud AS solicitud_id, resultado AS result,
              distancia_red_m AS network_distance, aprobado AS approved,
              created_at, updated_at
       FROM acometidas.informe_inspeccion WHERE id_orden_trabajo = $1`,
      [workOrderId],
    );
    if (result.length === 0) return null;
    const r = result[0];
    return new InspectionReportModel(
      r.report_id, r.work_order_id, r.solicitud_id, r.result,
      r.network_distance, null, null, null, null, null, null,
      r.approved, null, null, null, r.created_at, r.updated_at,
    );
  }

  async closeWorkOrder(workOrderId: string, completedStatusId: number): Promise<void> {
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = $1, fecha_completada = NOW(), updated_at = NOW()
       WHERE id_orden_trabajo = $2`,
      [completedStatusId, workOrderId],
    );
  }

  async changeRequestStatus(solicitudId: string, newStatus: string, userId: string, comment: string): Promise<void> {
    await this.databaseService.query(
      `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
      [solicitudId, newStatus, userId, comment],
    );
  }
}
