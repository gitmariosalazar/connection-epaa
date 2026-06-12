import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInspectionOrderRepository } from '../../../../domain/contracts/inspection-order.interface.repository';

@Injectable()
export class InspectionOrderPostgreSQLPersistence implements InterfaceInspectionOrderRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  /**
   * 1. Crea la OT en work_orders.orden_trabajo.
   * 2. La vincula en acometidas.solicitud_orden_trabajo.
   * El código de orden se genera automáticamente por trigger.
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
     *  - estado         → FK a work_orders.cat_estado_orden (código)
     *                    NOTIFICADA_INSPECCION → si aún no hay técnico asignado
     *                    PENDIENTE_INSPECCION  → si el técnico ya se asigna en la emisión
     *  - id_cliente     → cedula del cliente de la solicitud
     */
    const otResult = await this.databaseService.query<{
      id_orden_trabajo: string;
      codigo_orden: string;
    }>(
      `INSERT INTO work_orders.orden_trabajo (
         origen,
         id_entidad_origen,
         id_tipo_trabajo,
         id_prioridad,
         id_cliente,
         estado,
         direccion,
         metadata,
         created_by,
         usuario_asignado,
         usuario_asignacion,
         fecha_asignacion
       ) VALUES (
         'SOLICITUD',
         $2::uuid,
         (SELECT id_tipo_trabajo FROM work_orders.tipo_trabajo
          WHERE UPPER(nombre) = UPPER('Inspección de Factibilidad de Acometida') LIMIT 1),
         $1,
         (SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $2),
         CASE WHEN $5::uuid IS NULL THEN 'NOTIFICADA_INSPECCION' ELSE 'PENDIENTE_INSPECCION' END,
         (SELECT direccion FROM acometidas.solicitud WHERE id_solicitud = $2),
         jsonb_build_object(
           'descripcion', $3::text,
           'scheduled_date', $6::timestamptz,
           'module', 'connection.inspection-order'
         ),
         $4::uuid,
         $5::uuid,
         $4::uuid,
         CASE WHEN $5::uuid IS NULL THEN NULL ELSE NOW() END
       )
       RETURNING id_orden_trabajo, codigo_orden`,
      [
        priorityId,
        solicitudId,
        description,
        creatorId,
        technicianId,
        scheduledDate,
      ],
    );

    const workOrderId = otResult[0].id_orden_trabajo;
    const codigoOrden = otResult[0].codigo_orden;

    // 2. Vincular OT con la solicitud, tipo = INSPECCION
    await this.databaseService.query(
      `INSERT INTO acometidas.solicitud_orden_trabajo (id_solicitud, id_orden_trabajo, tipo_orden, numero_orden)
       VALUES ($1, $2, 'INSPECCION', $3)`,
      [solicitudId, workOrderId, codigoOrden],
    );

    return { workOrderId, codigoOrden };
  }

  async startInspectionOrder(
    workOrderId: string,
    technicianId: string,
    _startStatusId: number,
  ): Promise<{ solicitudId: string } | null> {
    /**
     * Estado inicial de la OT de inspección: NOTIFICADA_INSPECCION
     * El operador "emite" la OT que queda en PENDIENTE_INSPECCION (ya asignada al técnico).
     * Al "iniciar" la inspección se hace la única transición:
     *   PENDIENTE_INSPECCION → EN_PROCESO_INSPECCION
     */
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
         SET estado             = 'EN_PROCESO_INSPECCION',
             usuario_asignado   = $2::uuid,
             usuario_asignacion = $2::uuid,
             fecha_asignacion   = NOW(),
             fecha_inicio_campo = NOW(),
             updated_at         = NOW()
       WHERE id_orden_trabajo   = $1::uuid
         AND estado             = 'PENDIENTE_INSPECCION'`,
      [workOrderId, technicianId],
    );

    // Obtener la solicitud vinculada
    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `SELECT id_solicitud
       FROM acometidas.solicitud_orden_trabajo
       WHERE id_orden_trabajo = $1::uuid AND tipo_orden = 'INSPECCION'`,
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
      `SELECT acometidas.fn_cambiar_estado_solicitud($1::uuid, $2::text, $3::uuid, $4::text, '{}'::jsonb)`,
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
