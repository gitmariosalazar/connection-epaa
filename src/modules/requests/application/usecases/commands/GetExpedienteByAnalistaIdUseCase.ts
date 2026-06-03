import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { ExpedienteResponse } from '../../dto/response/request-queries.response';

/**
 * SRP: Única responsabilidad — recuperar el expediente completo
 * de un cliente con todos sus módulos relacionados.
 */
@Injectable()
export class GetExpedienteByAnalistaIdUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(analistaId: string): Promise<ExpedienteResponse[]> {
    const expediente =
      await this.repository.getExpedientesByAnalistaId(analistaId);
    if (!expediente || expediente.length === 0) {
      throw new RpcException({
        statusCode: 404,
        message: `Analista ${analistaId} no encontrado`,
      });
    }
    return expediente;
  }
}
