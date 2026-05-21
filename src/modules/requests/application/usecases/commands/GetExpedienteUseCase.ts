import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { ExpedienteResponse } from '../../dto/response/request-queries.response';

/**
 * SRP: Única responsabilidad — recuperar el expediente completo
 * de una solicitud con todos sus módulos relacionados.
 */
@Injectable()
export class GetExpedienteUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(solicitudId: string): Promise<ExpedienteResponse> {
    const expediente = await this.repository.getExpedienteBySolicitudId(solicitudId);
    if (!expediente) {
      throw new NotFoundException(`Solicitud ${solicitudId} no encontrada`);
    }
    return expediente;
  }
}
