import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceInstallationOrderRepository } from '../../../../domain/contracts/installation-order.interface.repository';

@Injectable()
export class InstallationOrderPostgreSQLPersistence implements InterfaceInstallationOrderRepository {
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
          WHERE UPPER(nombre) = UPPER('Instalación y Calibración de Medidor') LIMIT 1),
         $1,
         (SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $2),
         CASE WHEN $5::uuid IS NULL THEN 'NOTIFICADA_INSTALACION' ELSE 'PENDIENTE_INSTALACION' END,
         (SELECT direccion FROM acometidas.solicitud WHERE id_solicitud = $2),
         jsonb_build_object(
           'descripcion', $3::text,
           'scheduled_date', $6::text,
           'module', 'connection.installation-order'
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

    console.log(
      `OT creada con ID: ${workOrderId} y código: ${codigoOrden} para solicitud: ${solicitudId}`,
    );

    // 2. Vincular con la solicitud como tipo INSTALACION
    await this.databaseService.query(
      `INSERT INTO acometidas.solicitud_orden_trabajo (id_solicitud, id_orden_trabajo, tipo_orden, numero_orden)
       VALUES ($1, $2, 'INSTALACION', $3)`,
      [solicitudId, workOrderId, codigoOrden],
    );

    return { workOrderId, codigoOrden };
  }

  async startInstallationOrder(
    workOrderId: string,
    technicianId: string,
    _startStatusId: number,
  ): Promise<{ solicitudId: string } | null> {
    /**
     * Flujo exclusivo de instalación de acometidas (SRP):
     *   PENDIENTE_INSTALACION → EN_PROCESO_INSTALACION
     *
     * Un único UPDATE simple — el trigger fn_enforce_state_machine valida
     * que esta transición esté permitida en fn_validar_transicion_estado.
     */
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
         SET estado             = 'EN_PROCESO_INSTALACION',
             usuario_asignado   = $2::uuid,
             usuario_asignacion = $2::uuid,
             fecha_asignacion   = NOW(),
             fecha_inicio_campo = NOW(),
             updated_at         = NOW()
       WHERE id_orden_trabajo   = $1::uuid
         AND estado             = 'PENDIENTE_INSTALACION'`,
      [workOrderId, technicianId],
    );

    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `SELECT id_solicitud
       FROM acometidas.solicitud_orden_trabajo
       WHERE id_orden_trabajo = $1::uuid AND tipo_orden = 'INSTALACION'`,
      [workOrderId],
    );

    return result.length > 0 ? { solicitudId: result[0].id_solicitud } : null;
  }

  async completeInstallationOrder(
    workOrderId: string,
    _completedStatusId: number,
  ): Promise<{ solicitudId: string } | null> {
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = 'COMPLETADA',
           fecha_completada = NOW()
       WHERE id_orden_trabajo = $1`,
      [workOrderId],
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
    _failedStatusId: number,
    failureReason: string,
  ): Promise<{ solicitudId: string } | null> {
    await this.databaseService.query(
      `UPDATE work_orders.orden_trabajo
       SET estado = 'RECHAZADA_TECNICA'
       WHERE id_orden_trabajo = $1`,
      [workOrderId],
    );

    // Registrar el motivo en observaciones (tabla correcta según schema)
    await this.databaseService
      .query(
        `INSERT INTO work_orders.observaciones_orden_trabajo (id_orden_trabajo, texto, created_by)
       VALUES (
         $1,
         $2,
         (SELECT created_by FROM work_orders.orden_trabajo WHERE id_orden_trabajo = $1)
       )`,
        [workOrderId, `Falla en instalación: ${failureReason}`],
      )
      .catch(() => {
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
}
