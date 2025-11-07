import { Inject, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { PhotoConnectionMapper } from "../mappers/photo-connection.mapper";
import { statusCode } from "../../../../settings/environments/status-code";
import { validateFields } from "../../../../shared/validators/fields.validators";
import { InterfacePhotoConnectionUseCase } from "../usecases/photo-connection.use-case.interface";
import { InterfacePhotoConnectionRepository } from "../../domain/contracts/photo-connection.interface.repository";
import { PhotoConnectionResponse } from "../../domain/schemas/dto/response/photo-connection.response";
import { PhotoConnectionModel } from "../../domain/schemas/model/photo-connection.model";
import { CreatePhotoConnectionRequest } from "../../domain/schemas/dto/request/create.photo-connection.request";

@Injectable()
export class PhotoConnectionService implements InterfacePhotoConnectionUseCase {
  constructor(
    @Inject('PhotoConnectionRepository')
    private readonly photoConnectionRepository: InterfacePhotoConnectionRepository
  ) { }

  async createPhotoConnection(photoConnection: CreatePhotoConnectionRequest): Promise<PhotoConnectionResponse | null> {
    try {

      const requiredFields: string[] = ['connectionId', 'photoUrl'];
      const missingFieldMessages: string[] =
        validateFields(photoConnection, requiredFields);
      if (missingFieldMessages.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFieldMessages
        });
      }

      const photoConnectionModel: PhotoConnectionModel = PhotoConnectionMapper.fromCreatePhotoConnectionRequestToPhotoConnectionModel(photoConnection);

      const createdPhotoConnection = await this.photoConnectionRepository.createPhotoConnection(photoConnectionModel);

      if (!createdPhotoConnection) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Error creating photo reading'
        });
      }

      return createdPhotoConnection;
    } catch (error) {
      throw error;
    }
  }

  async getPhotoConnectionsByCadastralKey(cadastralKey: string): Promise<PhotoConnectionResponse[]> {
    try {
      if (!cadastralKey || cadastralKey.trim() === '') {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invalid cadastral key'
        });
      }

      const photoConnections = await this.photoConnectionRepository.getPhotoConnectionsByCadastralKey(cadastralKey);
      if (!photoConnections) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'No photo connections found for this cadastral key'
        });
      }
      return photoConnections;
    } catch (error) {
      throw error;
    }
  }
}