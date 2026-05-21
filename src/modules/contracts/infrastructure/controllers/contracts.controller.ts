import { Controller, Post, Patch } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GenerateContractUseCase, GenerateContractDto, SignContractUseCase, SignContractDto } from '../../application/usecases/ContractUseCases';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly generateContractUseCase: GenerateContractUseCase,
    private readonly signContractUseCase: SignContractUseCase,
  ) {}

  /** FASE 10: POST /contracts/solicitudes/:id/generar */
  @Post('solicitudes/:solicitudId/generar')
  @MessagePattern('contracts.generate')
  async generateContract(@Payload() dto: GenerateContractDto) {
    return await this.generateContractUseCase.execute(dto);
  }

  /** FASE 11: PATCH /contracts/:contractId/firmar */
  @Patch(':contractId/firmar')
  @MessagePattern('contracts.sign')
  async signContract(@Payload() dto: SignContractDto) {
    return await this.signContractUseCase.execute(dto);
  }
}
