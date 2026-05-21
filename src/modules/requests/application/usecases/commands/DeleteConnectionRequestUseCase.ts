import { RpcException } from '@nestjs/microservices';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { statusCode } from '../../../../../settings/environments/status-code';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';

export class DeleteConnectionRequestUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly requestRepository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(requestId: string): Promise<boolean> {
    try {
      if (!requestId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Request ID is required for deletion',
        });
      }
      const verifyIfExists =
        await this.requestRepository.getConnectionRequestById(requestId);

      if (!verifyIfExists) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Connection request not found',
        });
      }

      const result =
        await this.requestRepository.deleteConnectionRequest(requestId);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error deleting connection request',
      });
    }
  }
}
