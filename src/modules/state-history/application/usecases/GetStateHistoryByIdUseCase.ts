import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { StateHistoryResponse } from '../dto/response/state-history.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetStateHistoryByIdUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(historialId: number): Promise<StateHistoryResponse> {
    if (!historialId || historialId < 1) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'Valid historialId is required',
      });
    }

    const record = await this.repository.findById(historialId);
    if (!record) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `History entry ${historialId} not found`,
      });
    }

    return StateHistoryMapper.toResponse(record);
  }
}
