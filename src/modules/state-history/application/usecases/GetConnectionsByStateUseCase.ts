import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { PaginatedConnectionsByStateResponse } from '../dto/response/paginated-state-history.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetConnectionsByStateUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(
    stateId: number,
    sectorId?: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedConnectionsByStateResponse> {
    if (!stateId || stateId < 1) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'Valid stateId is required',
      });
    }

    const stateExists = await this.repository.verifyStateExists(stateId);
    if (!stateExists) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `State ID ${stateId} does not exist in catalog`,
      });
    }

    const sanitizedLimit = Math.min(Math.max(1, limit ?? 50), 200);
    const sanitizedOffset = Math.max(0, offset ?? 0);

    const [items, total] = await Promise.all([
      this.repository.findConnectionsByState(stateId, sectorId, sanitizedLimit, sanitizedOffset),
      this.repository.countConnectionsByState(stateId, sectorId),
    ]);

    return {
      items: items.map((item) => StateHistoryMapper.toConnectionByStateResponse(item)),
      total,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    };
  }
}
