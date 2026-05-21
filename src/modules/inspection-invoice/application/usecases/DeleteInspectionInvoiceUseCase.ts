import { RpcException } from '@nestjs/microservices';
import { InterfaceInspectionInvoiceRepository } from '../../domain/contracts/inspection-invoice.interface.repository';
import { statusCode } from '../../../../settings/environments/status-code';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';

export class DeleteInspectionInvoiceUseCase {
  constructor(
    @Inject('InterfaceInspectionInvoiceRepository')
    private readonly inspectionInvoiceRepository: InterfaceInspectionInvoiceRepository,
  ) {}

  async execute(invoiceId: string): Promise<boolean> {
    try {
      if (!invoiceId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invoice ID is required for deletion',
        });
      }
      const verifyIfExists =
        await this.inspectionInvoiceRepository.getInspectionInvoiceById(
          invoiceId,
        );

      if (!verifyIfExists) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Inspection invoice not found',
        });
      }

      const result =
        await this.inspectionInvoiceRepository.deleteInspectionInvoice(
          invoiceId,
        );
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error deleting inspection invoice',
      });
    }
  }
}
