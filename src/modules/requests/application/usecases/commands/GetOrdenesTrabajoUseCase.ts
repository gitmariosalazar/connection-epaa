import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { SolicitudOrdenTrabajoResponse } from '../../dto/response/request-queries.response';

/**
 * SRP: Única responsabilidad — recuperar las órdenes de trabajo
 * (inspección e instalación) vinculadas a una solicitud.
 */
@Injectable()
export class GetOrdenesTrabajoUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(solicitudId: string): Promise<SolicitudOrdenTrabajoResponse[]> {
    return await this.repository.getOrdenesTrabajoBysSolicitudId(solicitudId);
  }
}
