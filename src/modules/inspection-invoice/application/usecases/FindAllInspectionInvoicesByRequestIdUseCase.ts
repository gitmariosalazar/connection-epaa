import { Inject } from '@nestjs/common';
import { InterfaceInspectionInvoiceRepository } from '../../domain/contracts/inspection-invoice.interface.repository';
import { InspectionInvoiceResponse } from '../dto/response/inspection-invoice.response';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { InspectionInvoiceMapper } from '../mappers/inspection-invoice.mapper';

export class FindAllInspectionInvoicesByRequestIdUseCase {
  constructor(
    @Inject('InterfaceInspectionInvoiceRepository')
    private readonly inspectionInvoiceRepository: InterfaceInspectionInvoiceRepository,
  ) {}

  async execute(
    requestId: string,
    limit: number,
    offset: number,
  ): Promise<InspectionInvoiceResponse[]> {
    try {
      if (!requestId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Request ID is required to fetch inspection invoices',
        });
      }
      const invoices =
        await this.inspectionInvoiceRepository.findAllInspectionInvoicesByRequestId(
          requestId,
          limit,
          offset,
        );
      return InspectionInvoiceMapper.toResponseList(invoices);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error fetching inspection invoices by request ID',
      });
    }
  }
}
