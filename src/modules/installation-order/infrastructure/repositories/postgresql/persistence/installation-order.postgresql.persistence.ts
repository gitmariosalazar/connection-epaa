import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInstallationOrderRepository } from '../../../../domain/contracts/installation-order.interface.repository';

@Injectable()
export class InstallationOrderPostgreSQLPersistence
  implements InterfaceInstallationOrderRepository
{
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async issueInstallationOrder(
    solicitudId: string,
    technicianId: string | null,
    description: string,
    priorityId: number,
    scheduledDate: string | null,
    creatorId: string,
  ): Promise<{ workOrderId: string; codigoOrden: string }> {
    // 1. Crear OT de instalación — codigo_orden lo genera el TRIGGER trg_generar_codigo_orden
    const otResult = await this.databaseService.query<{
      id_orden_trabajo: string;
      codigo_orden: string;
    }>(
      `INSERT INTO work_orders.orden_trabajo (
         id_tipo_trabajo,
         id_prioridad,
         id_cliente,
         estado,
         descripcion,
         usuario_creacion,
         usuario_asignacion,
         fecha_asignacion
       ) VALUES (
         (SELECT id_tipo_trabajo FROM work_orders.tipo_trabajo
          WHERE UPPER(nombre) = 'AGUA POTABLE' LIMIT 1),
         $1,
         (SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $2),
         (SELECT id_estado FROM work_orders.estado_orden_trabajo
          WHERE UPPER(nombre_estado) = 'PENDIENTE' LIMIT 1),
         $3,
         $4::uuid,
         $5::uuid,
         CASE WHEN $5 IS NULL THEN NULL ELSE NOW() END
       )
       RETURNING id_orden_trabajo, codigo_orden`,
      [priorityId, solicitudId, description, creatorId, technicianId],
    );

    const workOrderId = otResult[0].id_orden_trabajo;
    const codigoOrden = otResult[0].codigo_orden;

    // 2. Vincular con la solicitud como tipo INSTALACION
    await this.databaseService.query(
      `INSERT INTO acometidas.solicitud_orden_trabajo (id_solicitud, id_orden_trabajo, tipo_orden)
       VALUES ($1, $2, 'INSTALACION')`,
      [solicitudId, workOrderId],
    );

    return { workOrderId, codigoOrden };
  }

  async startInstallationOrder(
    workOrderId: string,
    technicianId: string,
    startStatusId: number,
  ): Promise<{ solicitudId: string } | null> {
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = $1,
           usuario_asignacion = $2,
           fecha_asignacion = NOW()
       WHERE id_orden_trabajo = $3`,
      [startStatusId, technicianId, workOrderId],
    );

    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `SELECT id_solicitud
       FROM acometidas.solicitud_orden_trabajo
       WHERE id_orden_trabajo = $1 AND tipo_orden = 'INSTALACION'`,
      [workOrderId],
    );

    return result.length > 0 ? { solicitudId: result[0].id_solicitud } : null;
  }

  async completeInstallationOrder(
    workOrderId: string,
    completedStatusId: number,
  ): Promise<{ solicitudId: string } | null> {
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = $1,
           fecha_completada = NOW()
       WHERE id_orden_trabajo = $2`,
      [completedStatusId, workOrderId],
    );

    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `SELECT id_solicitud
       FROM acometidas.solicitud_orden_trabajo
       WHERE id_orden_trabajo = $1 AND tipo_orden = 'INSTALACION'`,
      [workOrderId],
    );

    return result.length > 0 ? { solicitudId: result[0].id_solicitud } : null;
  }

  async failInstallationOrder(
    workOrderId: string,
    failedStatusId: number,
    failureReason: string,
  ): Promise<{ solicitudId: string } | null> {
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = $1
       WHERE id_orden_trabajo = $2`,
      [failedStatusId, workOrderId],
    );

    // Registrar el motivo en observaciones (tabla correcta según schema)
    await this.databaseService.query(
      `INSERT INTO work_orders.observaciones_orden_trabajo (id_orden_trabajo, texto)
       VALUES ($1, $2)`,
      [workOrderId, `Falla en instalación: ${failureReason}`],
    ).catch(() => {
      // Si hay error en observaciones no bloquea el flujo principal
    });

    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `SELECT id_solicitud
       FROM acometidas.solicitud_orden_trabajo
       WHERE id_orden_trabajo = $1 AND tipo_orden = 'INSTALACION'`,
      [workOrderId],
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
      `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
      [solicitudId, newStatus, userId, comment],
    );
  }

  async getClientIdBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ id_cliente: string }>(
      `SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].id_cliente : null;
  }
}
