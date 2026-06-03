import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { TrackingSolicitudResponse } from '../../dto/response/request-queries.response';

/**
 * GetTrackingByClienteIdUseCase
 *
 * SRP  : una única responsabilidad — obtener el seguimiento de solicitudes de un cliente.
 * DIP  : depende de la abstracción InterfaceConnectionRequestRepository, no de la implementación concreta.
 * OCP  : el comportamiento puede extenderse en la persistencia sin modificar este caso de uso.
 */
@Injectable()
export class GetTrackingByClienteIdUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repo: InterfaceConnectionRequestRepository,
  ) {}

  /**
   * Retorna el listado de solicitudes de un cliente enriquecidas con:
   * - Fase actual del BPMN (currentStep, stepIndex)
   * - Estado legible (estadoActualLabel)
   * - Fecha formateada en español (fechaCreacion)
   * - Métricas (diasEnProceso, docs, pago, inspección, contrato, instalación)
   * - Timeline completo (historial)
   *
   * @param clienteId Cédula (10 dígitos) o RUC (13 dígitos) del cliente
   * @return Listado de solicitudes enriquecidas con su tracking
   */
  async execute(clienteId: string): Promise<TrackingSolicitudResponse[]> {
    if (!clienteId?.trim()) {
      throw new Error('clienteId es requerido');
    }
    return this.repo.getTrackingByClienteId(clienteId.trim());
  }
}
