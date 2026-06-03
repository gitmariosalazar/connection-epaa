import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceInstallationOrderRepository } from '../../domain/contracts/installation-order.interface.repository';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class IssueInstallationOrderDto {
  solicitudId: string;
  technicianId: string | null;
  description: string;
  priorityId: number;
  scheduledDate: string | null;
  creatorId: string;
}

export class StartInstallationDto {
  workOrderId: string;
  technicianId: string;
  /** ID del estado "EN_PROCESO" en work_orders.estado_orden_trabajo */
  startStatusId: number;
}

export class CompleteInstallationDto {
  workOrderId: string;
  userId: string;
  /** ID del estado "COMPLETADA" en work_orders.estado_orden_trabajo */
  completedStatusId: number;
}

export class FailInstallationDto {
  workOrderId: string;
  userId: string;
  failureReason: string;
  /** ID del estado "FALLIDA" en work_orders.estado_orden_trabajo */
  failedStatusId: number;
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

/**
 * Fase 12: Emitir Orden de Trabajo de Instalación
 * Transición: CONTRATO_FIRMADO → OT_INSTALACION_EMITIDA
 */
@Injectable()
export class IssueInstallationOrderUseCase {
  constructor(
    @Inject('InterfaceInstallationOrderRepository')
    private readonly repository: InterfaceInstallationOrderRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(dto: IssueInstallationOrderDto): Promise<{ workOrderId: string; codigoOrden: string; solicitudId: string }> {
    const { workOrderId, codigoOrden } = await this.repository.issueInstallationOrder(
      dto.solicitudId,
      dto.technicianId,
      dto.description,
      dto.priorityId,
      dto.scheduledDate,
      dto.creatorId,
    );

    await this.repository.changeRequestStatus(
      dto.solicitudId,
      'OT_INSTALACION_EMITIDA',
      dto.creatorId,
      `Orden de instalación ${codigoOrden} emitida`,
    );

    // Notificar a la cuadrilla técnica
    if (dto.technicianId) {
      this.notification.notifyOTInstalacionEmitida(
        dto.technicianId,
        dto.solicitudId,
        codigoOrden,
      );
    }

    return { workOrderId, codigoOrden, solicitudId: dto.solicitudId };
  }
}

/**
 * Fase 13a: Iniciar Instalación en Campo
 * Transición: OT_INSTALACION_EMITIDA → INSTALACION_EN_PROCESO
 */
@Injectable()
export class StartInstallationUseCase {
  constructor(
    @Inject('InterfaceInstallationOrderRepository')
    private readonly repository: InterfaceInstallationOrderRepository,
  ) {}

  async execute(dto: StartInstallationDto): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.startInstallationOrder(
      dto.workOrderId,
      dto.technicianId,
      dto.startStatusId,
    );

    if (!result) {
      throw new NotFoundException(`OT de instalación ${dto.workOrderId} no encontrada`);
    }

    await this.repository.changeRequestStatus(
      result.solicitudId,
      'INSTALACION_EN_PROCESO',
      dto.technicianId,
      'Cuadrilla técnica confirmó inicio de la instalación en campo',
    );

    return { solicitudId: result.solicitudId, newStatus: 'INSTALACION_EN_PROCESO' };
  }
}

/**
 * Fase 13b: Completar Instalación
 * Transición: INSTALACION_EN_PROCESO → INSTALACION_COMPLETADA → REGISTRO_CATASTRAL_PENDIENTE
 *
 * Se transiciona en dos pasos dentro de la misma función BD para que quede
 * registrado el paso intermedio en el historial de estados.
 */
@Injectable()
export class CompleteInstallationUseCase {
  constructor(
    @Inject('InterfaceInstallationOrderRepository')
    private readonly repository: InterfaceInstallationOrderRepository,
  ) {}

  async execute(dto: CompleteInstallationDto): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.completeInstallationOrder(
      dto.workOrderId,
      dto.completedStatusId,
    );

    if (!result) {
      throw new NotFoundException(`OT de instalación ${dto.workOrderId} no encontrada`);
    }

    // Paso 1: marcar como completada
    await this.repository.changeRequestStatus(
      result.solicitudId,
      'INSTALACION_COMPLETADA',
      dto.userId,
      'Instalación física completada exitosamente',
    );

    // Paso 2: avanzar automáticamente a pendiente de catastro
    await this.repository.changeRequestStatus(
      result.solicitudId,
      'REGISTRO_CATASTRAL_PENDIENTE',
      dto.userId,
      'Solicitud derivada a oficina catastral para registro y activación del suministro',
    );

    return { solicitudId: result.solicitudId, newStatus: 'REGISTRO_CATASTRAL_PENDIENTE' };
  }
}

/**
 * Fase 13c: Instalación Fallida
 * Transición: INSTALACION_EN_PROCESO → INSTALACION_FALLIDA
 */
@Injectable()
export class FailInstallationUseCase {
  constructor(
    @Inject('InterfaceInstallationOrderRepository')
    private readonly repository: InterfaceInstallationOrderRepository,
  ) {}

  async execute(dto: FailInstallationDto): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.failInstallationOrder(
      dto.workOrderId,
      dto.failedStatusId,
      dto.failureReason,
    );

    if (!result) {
      throw new NotFoundException(`OT de instalación ${dto.workOrderId} no encontrada`);
    }

    await this.repository.changeRequestStatus(
      result.solicitudId,
      'INSTALACION_FALLIDA',
      dto.userId,
      `Instalación fallida: ${dto.failureReason}`,
    );

    return { solicitudId: result.solicitudId, newStatus: 'INSTALACION_FALLIDA' };
  }
}
