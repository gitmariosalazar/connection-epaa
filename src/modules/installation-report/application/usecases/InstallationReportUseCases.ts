import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceInstallationReportRepository } from '../../domain/contracts/installation-report.interface.repository';
import { InstallationReportModel } from '../../domain/schemas/models/InstallationReportModel';
import { SubmitInstallationReportDto } from '../dto/request/submit-installation-report.dto';

@Injectable()
export class SubmitInstallationReportUseCase {
  constructor(
    @Inject('InterfaceInstallationReportRepository')
    private readonly repository: InterfaceInstallationReportRepository,
  ) {}

  async execute(
    dto: SubmitInstallationReportDto,
    technicianId: string,
    completedStatusId: number, // 4 = Completada
  ): Promise<InstallationReportModel> {
    const report = new InstallationReportModel(
      null,
      dto.workOrderId,
      null, // solicitudId is not provided by dto, backend needs to figure it out from work order
      dto.result,
      null,
      dto.meterNumber ?? null,
      dto.initialReading ?? null,
      dto.securitySeal ?? null,
      dto.connectionDiameter ?? null,
      dto.geomMeter ?? null,
      dto.finalConditions ?? null,
      dto.observations ?? null,
      dto.clientSignatureUrl ?? null,
      null,
      null,
      null,
      null,
      null,
    );

    // 1. Guardar informe
    const saved = await this.repository.createInstallationReport(report);
    if (!saved) throw new NotFoundException('No se pudo guardar el informe de instalación');

    // 2. Cerrar OT en work_orders
    await this.repository.closeWorkOrder(
      dto.workOrderId,
      completedStatusId,
    );

    const newStatus = dto.result.toUpperCase() === 'EXITOSO' ? 'INSTALACION_COMPLETADA' : 'INSTALACION_FALLIDA';

    if (!saved.solicitudId) {
      throw new Error('No se pudo determinar la solicitud asociada a esta orden de trabajo');
    }

    // 3. Transición de estado (siempre via función BD)
    await this.repository.changeRequestStatus(
      saved.solicitudId,
      newStatus,
      technicianId,
      'Informe de instalación enviado.',
    );

    // TODO: We could notify the client here using INotificationPort.

    return saved;
  }
}
