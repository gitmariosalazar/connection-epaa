import { Inject } from '@nestjs/common';
import { InterfaceConnectionDocumentRepository } from '../../domain/contracts/connection-document.interface.repository';
import { ConnectionDocumentResponse } from '../dto/response/connection-document.response';
import { CreateConnectionDocumentMapper } from '../mappers/connection-document.mapper';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { statusCode } from '../../../../settings/environments/status-code';

export class GetConnectionDocumentByIdUseCase {
  constructor(
    // Inject your repository here, for example:
    @Inject('InterfaceConnectionDocumentRepository')
    private readonly documentRepository: InterfaceConnectionDocumentRepository,
  ) {}

  async execute(
    documentId: string,
  ): Promise<ConnectionDocumentResponse | null> {
    try {
      if (!documentId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Document ID is required',
        });
      }
      const document =
        await this.documentRepository.getConnectionDocumentById(documentId);

      if (!document) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Connection document not found',
        });
      }

      return CreateConnectionDocumentMapper.fromModelToResponse(document);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving connection document by ID',
      });
    }
  }
}
