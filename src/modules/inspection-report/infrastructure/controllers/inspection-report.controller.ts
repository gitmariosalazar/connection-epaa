import { Controller, Post, Patch, Body, Param, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  SubmitInspectionReportUseCase,
  SubmitInspectionReportDto,
  ApproveInspectionReportUseCase,
  ApproveInspectionReportDto,
  GetWorkOrderInspectionDetailByOrderCodeOrRequestNumberUseCase,
} from '../../application/usecases/InspectionReportUseCases';

@Controller('inspection-report')
export class InspectionReportController {
  constructor(
    private readonly submitUseCase: SubmitInspectionReportUseCase,
    private readonly approveUseCase: ApproveInspectionReportUseCase,
    private readonly getReportUseCase: GetWorkOrderInspectionDetailByOrderCodeOrRequestNumberUseCase,
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

  @Get('ordenes/:orderCodeOrRequestNumber/informe')
  @MessagePattern('inspection_report.get-by-order-code-or-request-number')
  async getReportByOrderCodeOrRequestNumber(
    @Payload() payload: { orderCodeOrRequestNumber: string },
  ) {
    const { orderCodeOrRequestNumber } = payload;
    return await this.getReportUseCase.execute(orderCodeOrRequestNumber);
  }
}
