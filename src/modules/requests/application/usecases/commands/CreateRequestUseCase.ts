import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { CreateRequestRequest } from '../../dto/request/create-request.request';
import { RequestResponse } from '../../dto/response/request.response';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';
import { RequestMapper } from '../../mappers/request.mapper';
import { RequestModel } from '../../../domain/schemas/models/RequestModel';
import { validateFields } from '../../../../../shared/validators/fields.validators';

@Injectable()
export class CreateRequestUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly requestRepository: InterfaceConnectionRequestRepository, // Replace 'any' with the actual type of your repository
  ) {}

  async execute(request: CreateRequestRequest): Promise<RequestResponse> {
    try {
      const fieldRequired: string[] = [
        'clientId',
        'personType',
        'connectionType',
        'propertyUse',
        'address',
        'cadastralKey',
      ];

      const missingFields: string[] = validateFields(request, fieldRequired);

      if (missingFields.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFields,
        });
      }

      const requestModel: RequestModel =
        RequestMapper.fromRequestToModel(request);
      const createdRequest: RequestModel | null =
        await this.requestRepository.createConnectionRequest(requestModel);

      if (!createdRequest) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Failed to create new connection request',
        });
      }

      return RequestMapper.fromModelToResponse(createdRequest);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error creating new connection request',
      });
    }
  }
}
