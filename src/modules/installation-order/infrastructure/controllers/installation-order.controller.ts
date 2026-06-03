import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IssueInstallationOrderUseCase,
  IssueInstallationOrderDto,
  StartInstallationUseCase,
  StartInstallationDto,
  CompleteInstallationUseCase,
  CompleteInstallationDto,
  FailInstallationUseCase,
  FailInstallationDto,
} from '../../application/usecases/InstallationOrderUseCases';

@Controller('installation-order')
export class InstallationOrderController {
  constructor(
    private readonly issueUseCase: IssueInstallationOrderUseCase,
    private readonly startUseCase: StartInstallationUseCase,
    private readonly completeUseCase: CompleteInstallationUseCase,
    private readonly failUseCase: FailInstallationUseCase,
  ) {}

  /** FASE 12: POST /installation-order/solicitudes/emitir-ot */
  @MessagePattern('installation_order.issue')
  async issueOrder(@Payload() dto: IssueInstallationOrderDto) {
    return await this.issueUseCase.execute(dto);
  }

  /** FASE 13a: PATCH /installation-order/ordenes/iniciar */
  @MessagePattern('installation_order.start')
  async startInstallation(@Payload() dto: StartInstallationDto) {
    return await this.startUseCase.execute(dto);
  }

  /** FASE 13b: PATCH /installation-order/ordenes/completar */
  @MessagePattern('installation_order.complete')
  async completeInstallation(@Payload() dto: CompleteInstallationDto) {
    return await this.completeUseCase.execute(dto);
  }

  /** FASE 13c: PATCH /installation-order/ordenes/fallar */
  @MessagePattern('installation_order.fail')
  async failInstallation(@Payload() dto: FailInstallationDto) {
    return await this.failUseCase.execute(dto);
  }
}
