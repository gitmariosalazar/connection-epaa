import { Controller, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterCadastralAndActivateUseCase, RegisterCadastralDto } from '../../application/usecases/RegisterCadastralAndActivateUseCase';

@Controller('cadastral')
export class CadastralController {
  constructor(
    private readonly registerCadastralUseCase: RegisterCadastralAndActivateUseCase,
  ) {}

  /**
   * FASE 14: POST /cadastral/solicitudes/:id/registro-catastral
   * Registra el predio en catastro y activa el suministro (estado final del proceso).
   */
  @Post('solicitudes/:solicitudId/registro-catastral')
  @MessagePattern('cadastral.register_and_activate')
  async registerAndActivate(@Payload() dto: RegisterCadastralDto) {
    return await this.registerCadastralUseCase.execute(dto);
  }
}
