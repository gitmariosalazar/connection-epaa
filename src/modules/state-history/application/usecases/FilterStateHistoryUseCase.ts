import { Inject, Injectable } from '@nestjs/common';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { FilterStateHistoryRequest } from '../dto/request/filter-state-history.request';
import { PaginatedStateHistoryResponse } from '../dto/response/paginated-state-history.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';

@Injectable()
export class FilterStateHistoryUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(request: FilterStateHistoryRequest): Promise<PaginatedStateHistoryResponse> {
    const sanitizedLimit = Math.min(Math.max(1, request.limit ?? 50), 200);
    const sanitizedOffset = Math.max(0, request.offset ?? 0);

    const filterCriteria = {
      connectionId: request.connectionId?.trim() || undefined,
      stateId: request.stateId && request.stateId > 0 ? request.stateId : undefined,
      userId: request.userId?.trim() || undefined,
      origin: request.origin,
      startDate: request.startDate ? new Date(request.startDate) : undefined,
      endDate: request.endDate ? new Date(request.endDate) : undefined,
      isReversal: typeof request.isReversal === 'boolean' ? request.isReversal : undefined,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    };

    const { items, total } = await this.repository.findFiltered(filterCriteria);

    return {
      items: items.map((item) => StateHistoryMapper.toResponse(item)),
      total,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    };
  }
}
