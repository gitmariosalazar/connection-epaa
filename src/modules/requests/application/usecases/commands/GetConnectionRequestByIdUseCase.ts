import { Inject } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { RequestResponse } from '../../dto/response/request.response';
import { RequestModel } from '../../../domain/schemas/models/RequestModel';
import { RequestMapper } from '../../mappers/request.mapper';

export class GetConnectionRequestByIdUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly requestRepository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(requestId: string): Promise<RequestResponse | null> {
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    const requestModel: RequestModel | null =
      await this.requestRepository.getConnectionRequestById(requestId);

    if (!requestModel) {
      return null;
    }

    const requestResponse: RequestResponse =
      RequestMapper.fromModelToResponse(requestModel);

    return requestResponse;
  }
}
