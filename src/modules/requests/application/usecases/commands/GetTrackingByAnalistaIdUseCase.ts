import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { TrackingSolicitudResponse } from '../../dto/response/request-queries.response';

@Injectable()
export class GetTrackingByAnalistaIdUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repo: InterfaceConnectionRequestRepository,
  ) {}

  /**
   * Retorna el listado de solicitudes asignadas a un analista enriquecidas con:
   * - Fase actual del BPMN (currentStep, stepIndex)
   * - Estado legible (estadoActualLabel)
   * - Fecha formateada en español (fechaCreacion)
   * - Métricas (diasEnProceso, docs, pago, inspección, contrato, instalación)
   * - Timeline completo (historial)
   *
   * @param analistaId Identificador del analista (UUID)
   * @returns Listado de solicitudes asignadas al analista
   */
  async execute(
    analistaId: string,
    isSuperAdmin = false,
  ): Promise<TrackingSolicitudResponse[]> {
    if (!analistaId?.trim()) {
      throw new Error('analistaId es requerido');
    }
    if (isSuperAdmin) {
      return this.repo.getTrackingForSuperAdmin();
    }
    return this.repo.getTrackingByAnalistaId(analistaId.trim());
  }
}
