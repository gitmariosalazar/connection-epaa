import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  SubmitInstallationReportUseCase,
  GetInstallationReportByWorkOrderUseCase,
} from '../../application/usecases/InstallationReportUseCases';
import { GetWorkOrderInstallationDetailByOrderCodeOrRequestNumberUseCase } from '../../application/usecases/InstallationReportUseCases';
import { SubmitInstallationReportDto } from '../../application/dto/request/submit-installation-report.dto';
import { InstallationReportResponseDto } from '../../application/dto/response/installation-report.response.dto';
import { InstallationReportResponse } from '../../domain/schemas/dto/response/installation-response';

@Controller('installation-reports')
export class InstallationReportController {
  constructor(
    private readonly submitInstallationReportUseCase: SubmitInstallationReportUseCase,
    private readonly getInstallationReportByWorkOrderUseCase: GetInstallationReportByWorkOrderUseCase,
    private readonly getInstallationReportByOrderCodeOrRequestNumberUseCase: GetWorkOrderInstallationDetailByOrderCodeOrRequestNumberUseCase,
  ) {}

  @Post()
  @MessagePattern('installation_report.submit')
  async submitReport(
    @Payload() dto: SubmitInstallationReportDto,
  ): Promise<InstallationReportResponseDto> {
    const technicianId = dto.userId;
    if (!technicianId) {
      throw new BadRequestException(
        'El identificador del técnico (userId) es requerido',
      );
    }

    const report = await this.submitInstallationReportUseCase.execute(
      dto,
      technicianId,
      'INSTALACION_EJECUTADA', // Estado de Work Order
    );

    return new InstallationReportResponseDto(report);
  }

  @Get(':workOrderId')
  @MessagePattern('installation_report.get')
  async getReportByWorkOrder(
    @Payload() payload: { workOrderId: string },
  ): Promise<InstallationReportResponseDto> {
    const report = await this.getInstallationReportByWorkOrderUseCase.execute(
      payload.workOrderId,
    );
    return new InstallationReportResponseDto(report);
  }

  @Get('by-order-code-or-request-number/:orderCodeOrRequestNumber')
  @MessagePattern('installation_report.get-by-order-code-or-request-number')
  async getReportByOrderCodeOrRequestNumber(
    @Payload() payload: { orderCodeOrRequestNumber: string },
  ): Promise<InstallationReportResponse | null> {
    const report =
      await this.getInstallationReportByOrderCodeOrRequestNumberUseCase.execute(
        payload.orderCodeOrRequestNumber,
      );
    if (!report) {
      throw new NotFoundException(
        `No se encontró un informe de instalación para el código de orden o número de solicitud: ${payload.orderCodeOrRequestNumber}`,
      );
    }
    return report;
  }
}
