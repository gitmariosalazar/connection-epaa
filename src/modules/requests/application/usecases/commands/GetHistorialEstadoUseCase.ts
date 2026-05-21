import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { HistorialEstadoResponse } from '../../dto/response/request-queries.response';

/**
 * SRP: Única responsabilidad — recuperar el historial de estados
 * para alimentar el stepper/timeline del frontend.
 */
@Injectable()
export class GetHistorialEstadoUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(solicitudId: string): Promise<HistorialEstadoResponse[]> {
    return await this.repository.getHistorialBySolicitudId(solicitudId);
  }
}
