import { Inject } from '@nestjs/common';
import { InterfaceConnectionDocumentRepository } from '../../domain/contracts/connection-document.interface.repository';
import { ConnectionDocumentResponse } from '../dto/response/connection-document.response';
import { CreateConnectionDocumentMapper } from '../mappers/connection-document.mapper';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { statusCode } from '../../../../settings/environments/status-code';

export class FindAllConnectionDocumentsUseCase {
  constructor(
    // Inject your repository here, for example:
    @Inject('InterfaceConnectionDocumentRepository')
    private readonly documentRepository: InterfaceConnectionDocumentRepository,
  ) {}

  async execute(
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentResponse[]> {
    try {
      const documents =
        await this.documentRepository.findAllConnectionDocuments(
          limit,
          offset,
        );

      return documents.map((doc) =>
        CreateConnectionDocumentMapper.fromModelToResponse(doc),
      );
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error fetching connection documents',
      });
    }
  }
}
