import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { RequestModel } from '../../../domain/schemas/models/RequestModel';
import { RequestResponse } from '../../dto/response/request.response';
import { UpdateRequestRequest } from '../../dto/request/update-request.request';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../settings/environments/status-code';
import { RequestMapper } from '../../mappers/request.mapper';
import { validateFields } from '../../../../../shared/validators/fields.validators';

@Injectable()
export class UpdateRequestUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly requestRepository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(
    requestId: string,
    updateData: Partial<UpdateRequestRequest>,
  ): Promise<RequestResponse | null> {
    try {
      if (!requestId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Request ID is required for update',
        });
      }
      const existingRequest: RequestModel | null =
        await this.requestRepository.getConnectionRequestById(requestId);

      console.log('Existing Request:', existingRequest);

      if (!existingRequest || existingRequest === null) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Connection request not found',
        });
      }

      const requiredFields: string[] = [
        'clientId',
        'personType',
        'connectionType',
        'propertyUse',
        'address',
        'cadastralKey',
      ];

      const missingFields: string[] = validateFields(
        updateData,
        requiredFields,
      );

      if (missingFields.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFields,
        });
      }

      const updatedRequestModel: RequestModel =
        RequestMapper.fromRequestToModelForUpdate(
          updateData as UpdateRequestRequest,
          existingRequest,
        );

      const updatedRequest: RequestModel | null =
        await this.requestRepository.updateConnectionRequest(
          requestId,
          updatedRequestModel,
        );

      if (!updatedRequest) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Failed to update connection request',
        });
      }

      return RequestMapper.fromModelToResponse(updatedRequest);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error updating connection request',
      });
    }
  }
}
