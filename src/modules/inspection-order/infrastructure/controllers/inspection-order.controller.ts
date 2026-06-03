import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IssueInspectionOrderUseCase,
  IssueInspectionOrderDto,
  StartInspectionUseCase,
  StartInspectionDto,
} from '../../application/usecases/InspectionOrderUseCases';

@Controller('inspection-order')
export class InspectionOrderController {
  constructor(
    private readonly issueUseCase: IssueInspectionOrderUseCase,
    private readonly startUseCase: StartInspectionUseCase,
  ) {}

  /**
   * FASE 6: Emitir Orden de Inspección
   * POST /inspection-order/solicitudes/emitir
   * Kafka: inspection_order.issue
   */
  @MessagePattern('inspection_order.issue')
  async issueOrder(@Payload() dto: IssueInspectionOrderDto) {
    return await this.issueUseCase.execute(dto);
  }

  /**
   * FASE 7: Iniciar Inspección en Campo
   * PATCH /inspection-order/ordenes/iniciar
   * Kafka: inspection_order.start
   */
  @MessagePattern('inspection_order.start')
  async startInspection(@Payload() dto: StartInspectionDto) {
    return await this.startUseCase.execute(dto);
  }
}
