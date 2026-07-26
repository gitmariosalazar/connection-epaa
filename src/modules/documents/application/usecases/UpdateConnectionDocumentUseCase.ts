import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionDocumentRepository } from '../../domain/contracts/connection-document.interface.repository';
import { UpdateConnectionDocumentRequest } from '../dto/request/update-connection-document.request';
import { ConnectionDocumentResponse } from '../dto/response/connection-document.response';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { statusCode } from '../../../../settings/environments/status-code';
import { CreateConnectionDocumentMapper } from '../mappers/connection-document.mapper';
import { ConnectionDocumentModel } from '../../domain/schemas/models/ConnectionDocumentModel';
import { UploadFileService } from '../services/upload-file.service';

@Injectable()
export class UpdateConnectionDocumentUseCase {
  constructor(
    @Inject('InterfaceConnectionDocumentRepository')
    private readonly documentRepository: InterfaceConnectionDocumentRepository,
    private readonly uploadFileService: UploadFileService,
  ) {}

  async execute(
    documentId: string,
    request: Partial<UpdateConnectionDocumentRequest>,
  ): Promise<ConnectionDocumentResponse | null> {
    try {
      if (!documentId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Document ID is required for update',
        });
      }

      const existingDocument =
        await this.documentRepository.getConnectionDocumentById(documentId);

      if (!existingDocument) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Connection document not found',
        });
      }

      if (!request || Object.keys(request).length === 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'At least one field must be provided to update the document',
        });
      }

      let fileMetadata = {
        fileUrl: request.fileUrl ?? existingDocument.fileUrl,
        mimeType: request.mimeType ?? existingDocument.mimeType,
        sizeInBytes: request.sizeInBytes ?? existingDocument.sizeInBytes,
        hashSha256: request.hashSha256 ?? existingDocument.hashSha256,
      };

      if (request.fileBase64) {
        fileMetadata = await this.uploadFileService.uploadDocument({
          fileBase64: request.fileBase64,
          originalName: request.originalName ?? existingDocument.originalName,
          mimeType: request.mimeType,
        });
      }

      const normalizedRequest: UpdateConnectionDocumentRequest = {
        requestId: request.requestId ?? existingDocument.requestId,
        documentTypeId:
          request.documentTypeId ?? existingDocument.documentTypeId,
        fileUrl: fileMetadata.fileUrl,
        originalName: request.originalName ?? existingDocument.originalName,
        mimeType: fileMetadata.mimeType,
        sizeInBytes: fileMetadata.sizeInBytes,
        hashSha256: fileMetadata.hashSha256,
        validationStatus: request.fileBase64
          ? 'CORREGIDO'
          : (request.validationStatus ?? existingDocument.validationStatus),
        observation: request.fileBase64
          ? null
          : (request.observation ?? existingDocument.observation),
        validatorId: request.fileBase64
          ? null
          : (request.validatorId ?? existingDocument.validatorId),
      } as UpdateConnectionDocumentRequest;

      const updatedDataModel: ConnectionDocumentModel =
        CreateConnectionDocumentMapper.fromRequestToModelForUpdate(
          normalizedRequest,
          existingDocument,
        );
      const updatedDocument =
        await this.documentRepository.updateConnectionDocument(
          documentId,
          updatedDataModel,
        );

      if (!updatedDocument) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update connection document',
        });
      }

      return CreateConnectionDocumentMapper.fromModelToResponse(
        updatedDocument,
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error updating connection document',
      });
    }
  }
}
