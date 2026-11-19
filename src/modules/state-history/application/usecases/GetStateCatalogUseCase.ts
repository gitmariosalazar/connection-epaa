import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { StateCatalogResponse } from '../dto/response/state-catalog.response';
import { StateHistoryMapper } from '../mappers/state-history.mapper';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class GetStateCatalogUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async getAll(): Promise<StateCatalogResponse[]> {
    const catalog = await this.repository.getStateCatalog();
    return catalog.map((item) => StateHistoryMapper.toCatalogResponse(item));
  }

  async getById(stateId: number): Promise<StateCatalogResponse> {
    if (!stateId || stateId < 1) {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'Valid stateId is required',
      });
    }

    const item = await this.repository.getStateCatalogById(stateId);
    if (!item) {
      throw new RpcException({
        statusCode: statusCode.NOT_FOUND,
        message: `State ID ${stateId} not found in catalog`,
      });
    }

    return StateHistoryMapper.toCatalogResponse(item);
  }
}
