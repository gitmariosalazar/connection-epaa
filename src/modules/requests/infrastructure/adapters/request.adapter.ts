import { CreateRequestRequest } from '../../application/dto/request/create-request.request';
import { RequestResponse } from '../../application/dto/response/request.response';
import { RequestModel } from '../../domain/schemas/models/RequestModel';
import { RequestSqlResult } from '../interfaces/sql/request.sql.result';

export class RequestAdapter {
  static toResponse(requestModel: RequestModel): RequestResponse {
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

  static toRequestModel(
    createRequestRequest: CreateRequestRequest,
    requestId: string,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ): RequestModel {
    return new RequestModel(
      requestId,
      createRequestRequest.clientId,
      createRequestRequest.personType,
      createRequestRequest.connectionType,
      createRequestRequest.propertyUse,
      createRequestRequest.address,
      createRequestRequest.cadastralKey,
      createRequestRequest.geom,
      status,
      createRequestRequest.additionalInfo,
      null,
      createdAt,
      updatedAt,
    );
  }

  static toRequestModelFromSqlResult(
    requestSqlResult: RequestSqlResult,
  ): RequestModel {
    return new RequestModel(
      requestSqlResult.request_id,
      requestSqlResult.client_id,
      requestSqlResult.person_type,
      requestSqlResult.connection_type,
      requestSqlResult.property_use,
      requestSqlResult.address,
      requestSqlResult.cadastral_key,
      requestSqlResult.geom,
      requestSqlResult.status,
      requestSqlResult.additional_info,
      requestSqlResult.analystic_id,
      requestSqlResult.created_at,
      requestSqlResult.updated_at,
    );
  }
}
