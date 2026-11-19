import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { CurrentConnectionStateResponse } from '../dto/response/current-connection-state.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetCurrentConnectionStateUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(connectionId: string): Promise<CurrentConnectionStateResponse> {
    if (!connectionId?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'connectionId is required',
      });
    }

    const cleanConnectionId = connectionId.trim();
    const currentState = await this.repository.findCurrentStateByConnectionId(cleanConnectionId);
    if (!currentState) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `Connection ${cleanConnectionId} not found`,
      });
    }

    return StateHistoryMapper.toCurrentStateResponse(currentState);
  }
}
