import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { InterfaceInspectionReportRepository } from '../../domain/contracts/inspection-report.interface.repository';
import { InspectionReportModel } from '../../domain/schemas/models/InspectionReportModel';
import { INotificationPort } from '../../../../shared/notifications/notification.port';
import { InspectionReportResponse } from '../../domain/schemas/dto/response/inspection-response';

export class SubmitInspectionReportDto {
  workOrderId!: string;
  solicitudId!: string;
  result!: string;
  networkDistanceM?: number;
  connectionDiameter?: string;
  terrainConditions?: string;
  observations?: string;
  longitude?: number;
  latitude?: number;
  materialCost?: number;
  laborCost?: number;
  technicianId!: string;
  completedStatus!: string; // ID del estado "Completada" en work_orders
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

  async execute(
    dto: SubmitInspectionReportDto,
  ): Promise<InspectionReportModel> {
    const geom =
      dto.longitude && dto.latitude
        ? `POINT(${dto.longitude} ${dto.latitude})`
        : null;

    const report = new InspectionReportModel(
      null,
      dto.workOrderId,
      dto.solicitudId,
      dto.result,
      dto.networkDistanceM ?? null,
      dto.connectionDiameter ?? null,
      dto.terrainConditions ?? null,
      dto.observations ?? null,
      geom,
      dto.materialCost ?? null,
      dto.laborCost ?? null,
      null,
      null,
      null,
      null,
    );

    // 1. Guardar informe
    const saved = await this.repository.createInspectionReport(report);
    if (!saved)
      throw new RpcException({
        message: 'No se pudo guardar el informe',
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
      });

    // 2. Cerrar OT en work_orders
    await this.repository.closeWorkOrder(
      dto.workOrderId,
      dto.completedStatus,
      dto.technicianId
    );

    // 3. Transición de estado (siempre via función BD)
    await this.repository.changeRequestStatus(
      dto.solicitudId,
      'INFORME_EN_REVISION',
      dto.technicianId,
      'Informe técnico enviado, pendiente de revisión administrativa',
    );

    // 4. Notificar al analista responsable que hay un informe pendiente de revisión (Fase 8)
    const analystId = await this.repository.getAnalystIdBySolicitud(
      dto.solicitudId,
    );
    this.notification.notifyInformeSubido(
      analystId ?? dto.technicianId,
      dto.solicitudId,
    );

    return saved;
  }
}

export class ApproveInspectionReportDto {
  reportId!: string;
  approved!: boolean;
  rejectionReason?: string;
  approverId!: string;
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

  async execute(
    dto: ApproveInspectionReportDto,
  ): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.approveInspectionReport(
      dto.reportId,
      dto.approved,
      dto.rejectionReason ?? null,
      dto.approverId,
    );
    if (!result)
      throw new RpcException({
        message: `Informe ${dto.reportId} no encontrado`,
        statusCode: statusCode.NOT_FOUND,
      });

    const newStatus = dto.approved ? 'INFORME_APROBADO' : 'RECHAZADA_TECNICA';
    const comment = dto.approved
      ? 'Informe técnico aprobado — factibilidad confirmada'
      : `Informe técnico rechazado: ${dto.rejectionReason ?? 'Sin motivo especificado'}`;

    await this.repository.changeRequestStatus(
      result.solicitudId,
      newStatus,
      dto.approverId,
      comment,
    );

    const clientId = await this.repository.getClientIdBySolicitud(
      result.solicitudId,
    );

    // Notificar al cliente según el resultado (Fase 9)
    if (clientId) {
      if (newStatus === 'INFORME_APROBADO') {
        this.notification.notifyInformeAprobado(clientId, result.solicitudId);
      } else {
        this.notification.notifyInformeRechazado(
          clientId,
          result.solicitudId,
          dto.rejectionReason ??
            'El informe técnico no cumple con los requisitos de factibilidad.',
        );
      }
    }

    return { solicitudId: result.solicitudId, newStatus };
  }
}

@Injectable()
export class GetWorkOrderInspectionDetailByOrderCodeOrRequestNumberUseCase {
  constructor(
    @Inject('InterfaceInspectionReportRepository')
    private readonly repository: InterfaceInspectionReportRepository,
  ) {}

  async execute(
    orderCodeOrRequestNumber: string,
  ): Promise<InspectionReportResponse | null> {
    const report =
      await this.repository.getWorkOrderInspectionDetailByOrderCodeOrRequestNumber(
        orderCodeOrRequestNumber,
      );
    if (!report) {
      throw new RpcException({
        message:
          'Informe de inspección no encontrado para esta orden o solicitud',
        statusCode: statusCode.NOT_FOUND,
      });
    }
    return report;
  }
}
