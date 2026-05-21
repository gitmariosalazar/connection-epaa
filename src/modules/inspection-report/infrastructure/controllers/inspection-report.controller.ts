import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  SubmitInspectionReportUseCase,
  SubmitInspectionReportDto,
  ApproveInspectionReportUseCase,
  ApproveInspectionReportDto,
} from '../../application/usecases/InspectionReportUseCases';

@Controller('inspection-report')
export class InspectionReportController {
  constructor(
    private readonly submitUseCase: SubmitInspectionReportUseCase,
    private readonly approveUseCase: ApproveInspectionReportUseCase,
  ) {}

  /** FASE 8: POST /inspection-report/ordenes/:workOrderId/informe */
  @Post('ordenes/:workOrderId/informe')
  @MessagePattern('inspection_report.submit')
  async submitReport(@Payload() dto: SubmitInspectionReportDto) {
    return await this.submitUseCase.execute(dto);
  }

  /** FASE 9: PATCH /inspection-report/informes/:reportId/aprobar */
  @Patch('informes/:reportId/aprobar')
  @MessagePattern('inspection_report.approve')
  async approveReport(@Payload() dto: ApproveInspectionReportDto) {
    return await this.approveUseCase.execute(dto);
  }
}
