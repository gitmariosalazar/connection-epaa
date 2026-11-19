import { Inject, Injectable } from '@nestjs/common';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { StateSummaryResponse } from '../dto/response/state-summary.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';

@Injectable()
export class GetStateSummaryUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(): Promise<StateSummaryResponse[]> {
    const summary = await this.repository.getStateSummary();
    return summary.map((item) => StateHistoryMapper.toSummaryResponse(item));
  }
}
