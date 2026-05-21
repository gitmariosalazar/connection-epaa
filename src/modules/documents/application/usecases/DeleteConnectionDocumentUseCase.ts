import { Inject } from '@nestjs/common';
import { InterfaceConnectionDocumentRepository } from '../../domain/contracts/connection-document.interface.repository';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { statusCode } from '../../../../settings/environments/status-code';

export class DeleteConnectionDocumentUseCase {
  constructor(
    // Inject your repository here, for example:
    @Inject('InterfaceConnectionDocumentRepository')
    private readonly documentRepository: InterfaceConnectionDocumentRepository,
  ) {}

  async execute(documentId: string): Promise<boolean> {
    try {
      if (!documentId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Document ID is required for deletion',
        });
      }
      const deleted =
        await this.documentRepository.deleteConnectionDocument(documentId);
      if (!deleted) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Document not found or could not be deleted',
        });
      }
      return deleted;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error deleting connection document',
      });
    }
  }
}
