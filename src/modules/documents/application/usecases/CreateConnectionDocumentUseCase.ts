import { Inject, Injectable } from '@nestjs/common';
import { ConnectionDocumentResponse } from '../dto/response/connection-document.response';
import { CreateConnectionDocumentRequest } from '../dto/request/create-connection-document.request';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { validateFields } from '../../../../shared/validators/fields.validators';
import { ConnectionDocumentModel } from '../../domain/schemas/models/ConnectionDocumentModel';
import { CreateConnectionDocumentMapper } from '../mappers/connection-document.mapper';
import { InterfaceConnectionDocumentRepository } from '../../domain/contracts/connection-document.interface.repository';
import { UploadFileService } from '../services/upload-file.service';

@Injectable()
export class CreateConnectionDocumentUseCase {
  constructor(
    // Inject your repository here, for example:
    @Inject('InterfaceConnectionDocumentRepository')
    private readonly documentRepository: InterfaceConnectionDocumentRepository,
    private readonly uploadFileService: UploadFileService,
  ) {}
  async execute(
    request: CreateConnectionDocumentRequest,
  ): Promise<ConnectionDocumentResponse | null> {
    try {
      const requiredFields: string[] = [
        'requestId',
        'documentTypeId',
        'originalName',
        'validationStatus',
      ];
      const missingFields: string[] = validateFields(request, requiredFields);

      if (missingFields.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFields,
        });
      }

      const uploadedFile = await this.uploadFileService.uploadDocument({
        fileBase64: request.fileBase64,
        fileUrl: request.fileUrl,
        originalName: request.originalName,
        mimeType: request.mimeType,
        sizeInBytes: request.sizeInBytes,
        hashSha256: request.hashSha256,
      });

      const normalizedRequest: CreateConnectionDocumentRequest = {
        ...request,
        fileUrl: uploadedFile.fileUrl,
        mimeType: uploadedFile.mimeType,
        sizeInBytes: uploadedFile.sizeInBytes,
        hashSha256: uploadedFile.hashSha256,
        observation: request.observation ?? '',
      } as CreateConnectionDocumentRequest;

      const connectionDocumentModel: ConnectionDocumentModel =
        CreateConnectionDocumentMapper.fromRequestToModel(normalizedRequest);

      const createdDocument =
        await this.documentRepository.createConnectionDocument(
          connectionDocumentModel,
        );

      if (!createdDocument) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Failed to create connection document',
        });
      }

      return CreateConnectionDocumentMapper.fromModelToResponse(
        createdDocument,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error creating connection document',
      });
    }
  }
}
