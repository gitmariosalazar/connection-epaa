import { Inject, Injectable } from '@nestjs/common';
import { TrackingSolicitudResponse } from '../../dto/response/request-queries.response';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';

@Injectable()
export class GetTrackingBySolicitudIdUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repo: InterfaceConnectionRequestRepository,
  ) {}

  /**
   * Retorna el tracking de una solicitud específica enriquecida con:
   * - Fase actual del BPMN (currentStep, stepIndex)
   * - Estado legible (estadoActualLabel)
   * - Fecha formateada en español (fechaCreacion)
   * - Métricas (diasEnProceso, docs, pago, inspección, contrato, instalación)
   * - Timeline completo (historial)
   *
   * @param solicitudId Identificador de la solicitud (UUID)
   */
  async execute(clienteId: string): Promise<TrackingSolicitudResponse | null> {
    if (!clienteId?.trim()) {
      throw new Error('clienteId es requerido');
    }
    return this.repo.getTrackingBySolicitudId(clienteId.trim());
  }
}
