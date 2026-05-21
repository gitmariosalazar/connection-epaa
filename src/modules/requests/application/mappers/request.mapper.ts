import { randomUUID } from 'crypto';
import { RequestModel } from '../../domain/schemas/models/RequestModel';
import { CreateRequestRequest } from '../dto/request/create-request.request';
import { UpdateRequestRequest } from '../dto/request/update-request.request';

export class RequestMapper {
  static fromRequestToModel(requestModel: CreateRequestRequest): RequestModel {
    return {
      requestId: randomUUID(),
      clientId: requestModel.clientId,
      personType: requestModel.personType,
      connectionType: requestModel.connectionType,
      propertyUse: requestModel.propertyUse,
      address: requestModel.address,
      cadastralKey: requestModel.cadastralKey,
      geom: requestModel.geom,
      status: 'DRAFT',
      additionalInfo: requestModel.additionalInfo,
      analysticId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static fromModelToResponse(requestModel: RequestModel) {
    return {
      requestId: requestModel.requestId,
      clientId: requestModel.clientId,
      personType: requestModel.personType,
      connectionType: requestModel.connectionType,
      propertyUse: requestModel.propertyUse,
      address: requestModel.address,
      cadastralKey: requestModel.cadastralKey,
      geom: requestModel.geom,
      status: requestModel.status,
      additionalInfo: requestModel.additionalInfo,
      analysticId: requestModel.analysticId,
      createdAt: requestModel.createdAt,
      updatedAt: requestModel.updatedAt,
    };
  }

  static fromRequestToModelForUpdate(
    requestModel: UpdateRequestRequest,
    existingModel: RequestModel,
  ): RequestModel {
    return {
      requestId: existingModel.requestId,
      clientId: requestModel.clientId,
      personType: requestModel.personType,
      connectionType: requestModel.connectionType,
      propertyUse: requestModel.propertyUse,
      address: requestModel.address,
      cadastralKey: requestModel.cadastralKey,
      geom: requestModel.geom,
      status: existingModel.status,
      additionalInfo: requestModel.additionalInfo,
      analysticId: existingModel.analysticId,
      createdAt: existingModel.createdAt,
      updatedAt: new Date(),
    };
  }
}
