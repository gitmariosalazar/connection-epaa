import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceInspectionReportRepository } from '../../domain/contracts/inspection-report.interface.repository';
import { InspectionReportModel } from '../../domain/schemas/models/InspectionReportModel';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

export class SubmitInspectionReportDto {
  workOrderId: string;
  solicitudId: string;
  result: string;
  networkDistanceM?: number;
  connectionDiameter?: string;
  terrainConditions?: string;
  observations?: string;
  longitude?: number;
  latitude?: number;
  materialCost?: number;
  laborCost?: number;
  technicianId: string;
  completedStatusId: number; // ID del estado "Completada" en work_orders
}

/**
 * Fase 8: Subida de Informe Técnico (INFORME_EN_REVISION)
 * Guarda el informe, cierra la OT y transiciona el estado de la solicitud.
 */
@Injectable()
export class SubmitInspectionReportUseCase {
  constructor(
    @Inject('InterfaceInspectionReportRepository')
    private readonly repository: InterfaceInspectionReportRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(dto: SubmitInspectionReportDto): Promise<InspectionReportModel> {
    const geom = dto.longitude && dto.latitude
      ? `POINT(${dto.longitude} ${dto.latitude})`
      : null;

    const report = new InspectionReportModel(
      null, dto.workOrderId, dto.solicitudId, dto.result,
      dto.networkDistanceM ?? null, dto.connectionDiameter ?? null,
      dto.terrainConditions ?? null, dto.observations ?? null,
      geom, dto.materialCost ?? null, dto.laborCost ?? null,
      null, null, null, null,
    );

    // 1. Guardar informe
    const saved = await this.repository.createInspectionReport(report);
    if (!saved) throw new NotFoundException('No se pudo guardar el informe');

    // 2. Cerrar OT en work_orders
    await this.repository.closeWorkOrder(dto.workOrderId, dto.completedStatusId);

    // 3. Transición de estado (siempre via función BD)
    await this.repository.changeRequestStatus(
      dto.solicitudId, 'INFORME_EN_REVISION', dto.technicianId,
      'Informe técnico enviado, pendiente de revisión administrativa',
    );

    // 4. Notificar a la jefatura que hay un informe pendiente de revisión (Fase 8)
    this.notification.notifyInformeSubido(dto.technicianId, dto.solicitudId);

    return saved;
  }
}

export class ApproveInspectionReportDto {
  reportId: string;
  approved: boolean;
  rejectionReason?: string;
  approverId: string;
}

/**
 * Fase 9: Aprobación Técnica (INFORME_APROBADO / RECHAZADA_TECNICA)
 */
@Injectable()
export class ApproveInspectionReportUseCase {
  constructor(
    @Inject('InterfaceInspectionReportRepository')
    private readonly repository: InterfaceInspectionReportRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(dto: ApproveInspectionReportDto): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.approveInspectionReport(
      dto.reportId, dto.approved, dto.rejectionReason ?? null, dto.approverId,
    );
    if (!result) throw new NotFoundException(`Informe ${dto.reportId} no encontrado`);

    const newStatus = dto.approved ? 'INFORME_APROBADO' : 'RECHAZADA_TECNICA';
    const comment = dto.approved
      ? 'Informe técnico aprobado — factibilidad confirmada'
      : `Informe técnico rechazado: ${dto.rejectionReason ?? 'Sin motivo especificado'}`;

    await this.repository.changeRequestStatus(
      result.solicitudId, newStatus, dto.approverId, comment,
    );

    // Notificar al cliente según el resultado (Fase 9)
    if (newStatus === 'INFORME_APROBADO') {
      this.notification.notifyInformeAprobado(result.solicitudId, result.solicitudId);
    } else {
      this.notification.notifyInformeRechazado(
        result.solicitudId,
        result.solicitudId,
        dto.rejectionReason ?? 'El informe técnico no cumple con los requisitos de factibilidad.',
      );
    }

    return { solicitudId: result.solicitudId, newStatus };
  }
}
