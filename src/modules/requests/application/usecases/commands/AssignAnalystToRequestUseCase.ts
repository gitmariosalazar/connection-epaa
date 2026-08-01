import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { AssignAnalystToRequestRequest } from '../../dto/request/assign-analyst.request';

/**
 * Asignación MANUAL de analista, elegida desde el frontend.
 * Solo cubre el caso en que la asignación automática (round-robin en
 * SubmitWithDocumentsUseCase) no pudo asignar a nadie (p.ej. sin analistas
 * activos disponibles al crear la solicitud). No reemplaza ni modifica esa
 * lógica: solo aplica cuando la solicitud aún no tiene analista.
 */
@Injectable()
export class AssignAnalystToRequestUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(
    dto: AssignAnalystToRequestRequest,
  ): Promise<{ solicitudId: string; analystId: string }> {
    if (!dto.solicitudId?.trim()) {
      throw new BadRequestException('solicitudId es requerido');
    }
    if (!dto.analystId?.trim()) {
      throw new BadRequestException('analystId es requerido');
    }

    try {
      return await this.repository.assignAnalystToRequest(
        dto.solicitudId.trim(),
        dto.analystId.trim(),
      );
    } catch (error) {
      const message = (error as Error).message ?? '';
      if (message.includes('no encontrada')) {
        throw new NotFoundException(message);
      }
      if (message.includes('ya tiene un analista asignado')) {
        throw new ConflictException(message);
      }
      if (message.includes('no es un analista activo')) {
        throw new BadRequestException(message);
      }
      throw error;
    }
  }
}
