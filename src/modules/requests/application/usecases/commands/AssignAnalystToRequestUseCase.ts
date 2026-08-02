import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { AssignAnalystToRequestRequest } from '../../dto/request/assign-analyst.request';
import { statusCode } from '../../../../../settings/environments/status-code';

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
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'solicitudId es requerido',
      });
    }
    if (!dto.analystId?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'analystId es requerido',
      });
    }

    try {
      return await this.repository.assignAnalystToRequest(
        dto.solicitudId.trim(),
        dto.analystId.trim(),
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      const message = (error as Error).message ?? '';
      if (message.includes('no encontrada')) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message,
        });
      }
      if (message.includes('ya tiene un analista asignado')) {
        throw new RpcException({
          statusCode: statusCode.CONFLICT,
          message,
        });
      }
      if (message.includes('no es un analista activo')) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message,
        });
      }
      throw error;
    }
  }
}
