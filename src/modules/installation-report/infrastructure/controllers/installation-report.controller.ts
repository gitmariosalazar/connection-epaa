import { Controller, Post, Body, Req, Get, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubmitInstallationReportUseCase } from '../../application/usecases/InstallationReportUseCases';
import { SubmitInstallationReportDto } from '../../application/dto/request/submit-installation-report.dto';
import { InstallationReportResponseDto } from '../../application/dto/response/installation-report.response.dto';
import { InterfaceInstallationReportRepository } from '../../domain/contracts/installation-report.interface.repository';
import { Inject } from '@nestjs/common';

@Controller('installation-reports')
export class InstallationReportController {
  constructor(
    private readonly submitInstallationReportUseCase: SubmitInstallationReportUseCase,
    @Inject('InterfaceInstallationReportRepository')
    private readonly repository: InterfaceInstallationReportRepository,
  ) {}

  @Post()
  @MessagePattern('installation_report.submit')
  async submitReport(
    @Payload() dto: SubmitInstallationReportDto,
  ): Promise<InstallationReportResponseDto> {
    const technicianId = '00000000-0000-0000-0000-000000000000'; // Auth not strictly passed via payload in this MVP unless we extract from dto

    const report = await this.submitInstallationReportUseCase.execute(
      dto,
      technicianId,
      4, // 4 = Completada in work_orders states (assuming standard)
    );

    return new InstallationReportResponseDto(report);
  }

  @Get(':workOrderId')
  @MessagePattern('installation_report.get')
  async getReportByWorkOrder(
    @Payload() payload: { workOrderId: string },
  ): Promise<InstallationReportResponseDto> {
    const report = await this.repository.getReportByWorkOrderId(payload.workOrderId);
    if (!report) {
      throw new NotFoundException('Informe de instalación no encontrado para esta orden');
    }
    return new InstallationReportResponseDto(report);
  }
}
