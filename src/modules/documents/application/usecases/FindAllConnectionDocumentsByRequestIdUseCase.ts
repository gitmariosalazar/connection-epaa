import { Inject } from '@nestjs/common';
import { InterfaceConnectionDocumentRepository } from '../../domain/contracts/connection-document.interface.repository';
import { ConnectionDocumentResponse } from '../dto/response/connection-document.response';
import { CreateConnectionDocumentMapper } from '../mappers/connection-document.mapper';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { statusCode } from '../../../../settings/environments/status-code';

export class FindAllConnectionDocumentsByRequestIdUseCase {
  constructor(
    // Inject your repository here, for example:
    @Inject('InterfaceConnectionDocumentRepository')
    private readonly documentRepository: InterfaceConnectionDocumentRepository,
  ) {}

  async execute(
    requestId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentResponse[]> {
    try {
      if (!requestId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Request ID is required to fetch documents',
        });
      }
      const documents =
        await this.documentRepository.findAllConnectionDocumentsByRequestId(
          requestId,
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
        message: 'Error fetching connection documents by request ID',
      });
    }
  }
}
