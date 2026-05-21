import { RpcException } from '@nestjs/microservices';
import { InterfaceInspectionInvoiceRepository } from '../../domain/contracts/inspection-invoice.interface.repository';
import { InspectionInvoiceResponse } from '../dto/response/inspection-invoice.response';
import { statusCode } from '../../../../settings/environments/status-code';
import { InspectionInvoiceMapper } from '../mappers/inspection-invoice.mapper';
import { Inject } from '@nestjs/common/decorators/core/inject.decorator';

export class GetInspectionInvoiceByIdUseCase {
  constructor(
    @Inject('InterfaceInspectionInvoiceRepository')
    private readonly inspectionInvoiceRepository: InterfaceInspectionInvoiceRepository,
  ) {}

  async execute(invoiceId: string): Promise<InspectionInvoiceResponse> {
    try {
      if (!invoiceId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invoice ID is required',
        });
      }

      const invoice =
        await this.inspectionInvoiceRepository.getInspectionInvoiceById(
          invoiceId,
        );

      if (!invoice) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message:
            'Inspection invoice not found with the provided ID: ' + invoiceId,
        });
      }

      return InspectionInvoiceMapper.toResponse(invoice);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving inspection invoice by ID',
      });
    }
  }
}
