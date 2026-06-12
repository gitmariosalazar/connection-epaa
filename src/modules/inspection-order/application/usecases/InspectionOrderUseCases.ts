import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceInspectionOrderRepository } from '../../domain/contracts/inspection-order.interface.repository';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class IssueInspectionOrderDto {
  solicitudId: string;
  /** ID del técnico inspector asignado (opcional al emitir, puede asignarse después) */
  technicianId: string | null;
  description: string;
  /** ID de prioridad en work_orders.prioridad_orden_trabajo */
  priorityId: number;
  scheduledDate: string | null;
  /** ID del analista que emite la orden */
  creatorId: string;
}

export class StartInspectionDto {
  workOrderId: string;
  technicianId: string;
  /** Legacy field: se mantiene por compatibilidad del contrato */
  startStatusId: number;
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

/**
 * Fase 6: Emitir Orden de Inspección (PAGO_CONFIRMADO → ORDEN_INSPECCION_EMITIDA)
 *
 * SRP: Crea la OT en work_orders, la vincula con la solicitud en
 *      acometidas.solicitud_orden_trabajo y transiciona el estado.
 * DIP: Depende de la abstracción InterfaceInspectionOrderRepository.
 */
@Injectable()
export class IssueInspectionOrderUseCase {
  constructor(
    @Inject('InterfaceInspectionOrderRepository')
    private readonly repository: InterfaceInspectionOrderRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(
    dto: IssueInspectionOrderDto,
  ): Promise<{
    workOrderId: string;
    codigoOrden: string;
    solicitudId: string;
  }> {
    // 1. Crear la OT y vincularla con la solicitud
    const { workOrderId, codigoOrden } =
      await this.repository.issueInspectionOrder(
        dto.solicitudId,
        dto.technicianId,
        dto.description,
        dto.priorityId,
        dto.scheduledDate,
        dto.creatorId,
      );

    // 2. Transición de estado (vía función BD, garantiza auditoría)
    await this.repository.changeRequestStatus(
      dto.solicitudId,
      'ORDEN_INSPECCION_EMITIDA',
      dto.creatorId,
      `Orden de inspección ${codigoOrden} emitida y asignada`,
    );

    // 3. Notificar al inspector asignado (fire-and-forget)
    if (dto.technicianId) {
      const address = await this.repository.getAddressBySolicitud(
        dto.solicitudId,
      );
      this.notification.notifyInspeccionAsignada(
        dto.technicianId,
        dto.solicitudId,
        address ?? 'Sin dirección registrada',
      );
    }

    return { workOrderId, codigoOrden, solicitudId: dto.solicitudId };
  }
}

/**
 * Fase 7: Iniciar Inspección en Campo (ORDEN_INSPECCION_EMITIDA → INSPECCION_EN_PROCESO)
 *
 * SRP: Actualiza el estado de la OT a EN_PROCESO y transiciona la solicitud.
 */
@Injectable()
export class StartInspectionUseCase {
  constructor(
    @Inject('InterfaceInspectionOrderRepository')
    private readonly repository: InterfaceInspectionOrderRepository,
  ) {}

  async execute(
    dto: StartInspectionDto,
  ): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.startInspectionOrder(
      dto.workOrderId,
      dto.technicianId,
      dto.startStatusId,
    );

    if (!result) {
      throw new NotFoundException(
        `Orden de trabajo ${dto.workOrderId} no encontrada`,
      );
    }

    await this.repository.changeRequestStatus(
      result.solicitudId,
      'INSPECCION_EN_PROCESO',
      dto.technicianId,
      'Inspector confirmó inicio de la visita técnica al predio',
    );

    return {
      solicitudId: result.solicitudId,
      newStatus: 'INSPECCION_EN_PROCESO',
    };
  }
}
