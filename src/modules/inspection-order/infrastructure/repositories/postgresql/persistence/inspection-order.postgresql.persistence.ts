import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInspectionOrderRepository } from '../../../../domain/contracts/inspection-order.interface.repository';

@Injectable()
export class InspectionOrderPostgreSQLPersistence
  implements InterfaceInspectionOrderRepository
{
  constructor(private readonly databaseService: DatabaseAbstract) {}

  /**
   * 1. Crea la OT en work_orders.orden_trabajo.
   * 2. La vincula en acometidas.solicitud_orden_trabajo.
   *
   * La tabla work_orders.orden_trabajo usa id_tipo_orden FK a work_orders.tipo_orden_trabajo.
   * El código de orden se genera con un sequence/prefix para trazabilidad.
   */
  async issueInspectionOrder(
    solicitudId: string,
    technicianId: string | null,
    description: string,
    priorityId: number,
    scheduledDate: string | null,
    creatorId: string,
  ): Promise<{ workOrderId: string; codigoOrden: string }> {
    /**
     * La tabla work_orders.orden_trabajo:
     *  - codigo_orden  → generado automáticamente por el TRIGGER trg_generar_codigo_orden
     *                    (usa numero_secuencial DEFAULT nextval('work_orders.orden_trabajo_seq'))
     *  - id_tipo_trabajo → NOT NULL, usamos el tipo "AGUA POTABLE" (id=2) para acometidas
     *  - estado         → FK a work_orders.estado_orden_trabajo, buscamos 'PENDIENTE'
     *  - id_cliente     → cedula del cliente de la solicitud
     */
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

    // 2. Vincular OT con la solicitud, tipo = INSPECCION
    await this.databaseService.query(
      `INSERT INTO acometidas.solicitud_orden_trabajo (id_solicitud, id_orden_trabajo, tipo_orden)
       VALUES ($1, $2, 'INSPECCION')`,
      [solicitudId, workOrderId],
    );

    return { workOrderId, codigoOrden };
  }


  async startInspectionOrder(
    workOrderId: string,
    technicianId: string,
    startStatusId: number,
  ): Promise<{ solicitudId: string } | null> {
    // Actualizar estado de la OT
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = $1,
           usuario_asignacion = $2,
           fecha_asignacion = NOW(),
           updated_at = NOW()
       WHERE id_orden_trabajo = $3`,
      [startStatusId, technicianId, workOrderId],
    );

    // Obtener la solicitud vinculada
    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `SELECT id_solicitud
       FROM acometidas.solicitud_orden_trabajo
       WHERE id_orden_trabajo = $1 AND tipo_orden = 'INSPECCION'`,
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

  async getAddressBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ direccion: string }>(
      `SELECT direccion FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].direccion : null;
  }
}
