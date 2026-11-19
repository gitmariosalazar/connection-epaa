import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { PaginatedStateHistoryResponse } from '../dto/response/paginated-state-history.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetConnectionHistoryUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(
    connectionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PaginatedStateHistoryResponse> {
    if (!connectionId?.trim()) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'connectionId is required',
      });
    }

    const cleanConnectionId = connectionId.trim();
    const exists = await this.repository.verifyConnectionExists(cleanConnectionId);
    if (!exists) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `Connection ${cleanConnectionId} not found`,
      });
    }

    const sanitizedLimit = Math.min(Math.max(1, limit ?? 50), 200);
    const sanitizedOffset = Math.max(0, offset ?? 0);

    const [items, total] = await Promise.all([
      this.repository.findByConnectionId(cleanConnectionId, sanitizedLimit, sanitizedOffset),
      this.repository.countByConnectionId(cleanConnectionId),
    ]);

    return {
      items: items.map((item) => StateHistoryMapper.toResponse(item)),
      total,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    };
  }
}
