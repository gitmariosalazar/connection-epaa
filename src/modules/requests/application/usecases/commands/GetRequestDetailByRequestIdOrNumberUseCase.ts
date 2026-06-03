import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { RequestDetailByClientResponse } from '../../dto/response/request-queries.response';

@Injectable()
export class GetRequestDetailByRequestIdOrNumberUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(
    requestNumberOrId: string,
  ): Promise<RequestDetailByClientResponse> {
    const detail =
      await this.repository.getRequestDetailByRequestIdOrNumber(
        requestNumberOrId,
      );

    if (!detail) {
      throw new RpcException({
        statusCode: 404,
        message: `Solicitud ${requestNumberOrId} no encontrada`,
      });
    }

    return detail;
  }
}
