import { Inject } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { RequestResponse } from '../../dto/response/request.response';
import { RequestModel } from '../../../domain/schemas/models/RequestModel';
import { RequestMapper } from '../../mappers/request.mapper';

export class FindAllConnectionRequestsUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly requestRepository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(
    limit: number,
    offset: number,
    status?: string,
  ): Promise<RequestResponse[]> {
    const requests: RequestModel[] =
      await this.requestRepository.findAllConnectionRequests(
        limit,
        offset,
        status,
      );

    if (!requests || requests.length === 0) {
      return [];
    }

    return requests.map((request) =>
      RequestMapper.fromModelToResponse(request),
    );
  }
}
