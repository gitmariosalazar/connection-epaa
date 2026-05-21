import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';

/**
 * Fase 2: Envío de Solicitud (DRAFT → DOCS_SUBMITTED)
 * El cliente confirma que adjuntó todos sus documentos y envía formalmente la solicitud.
 * SRP: Única responsabilidad — hacer la transición DRAFT → DOCS_SUBMITTED.
 */
@Injectable()
export class SubmitRequestUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(
    solicitudId: string,
    clientId: string,
  ): Promise<{ solicitudId: string; newStatus: string }> {
    // Verificar que la solicitud existe antes de cambiar estado
    const solicitud = await this.repository.getConnectionRequestById(solicitudId);
    if (!solicitud) {
      throw new NotFoundException(`Solicitud ${solicitudId} no encontrada`);
    }

    // Transición DRAFT → DOCS_SUBMITTED (la BD valida que sea una transición válida)
    await this.repository.changeRequestStatus(
      solicitudId,
      'DOCS_SUBMITTED',
      clientId,
      'Solicitud enviada formalmente por el cliente con documentación adjunta',
    );

    return { solicitudId, newStatus: 'DOCS_SUBMITTED' };
  }
}
