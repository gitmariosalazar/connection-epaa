import { Inject } from '@nestjs/common';
import { InterfaceInspectionInvoiceRepository } from '../../domain/contracts/inspection-invoice.interface.repository';
import { UpdateInspectionInvoiceRequest } from '../dto/request/update-inspection-invoice.request';
import { InspectionInvoiceResponse } from '../dto/response/inspection-invoice.response';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { InspectionInvoiceModel } from '../../domain/schemas/models/InspectionInvoiceModel';
import { InspectionInvoiceMapper } from '../mappers/inspection-invoice.mapper';

export class UpdateInspectionInvoiceUseCase {
  constructor(
    @Inject('InterfaceInspectionInvoiceRepository')
    private readonly inspectionInvoiceRepository: InterfaceInspectionInvoiceRepository,
  ) {}

  async execute(
    requestId: string,
    request: Partial<UpdateInspectionInvoiceRequest>,
  ): Promise<InspectionInvoiceResponse> {
    try {
      if (!requestId) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Invoice ID is required for update',
        });
      }

      const existingInvoice =
        await this.inspectionInvoiceRepository.getInspectionInvoiceById(
          requestId,
        );

      if (!existingInvoice) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message:
            'Inspection invoice not found for update with the provided ID: ' +
            requestId,
        });
      }

      const updateDataModel: InspectionInvoiceModel =
        InspectionInvoiceMapper.toModelForUpdate(
          request as UpdateInspectionInvoiceRequest,
          existingInvoice,
        );

      const updatedInvoice =
        await this.inspectionInvoiceRepository.updateInspectionInvoice(
          requestId,
          updateDataModel,
        );

      if (!updatedInvoice) {
        throw new RpcException({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update inspection invoice',
        });
      }

      return InspectionInvoiceMapper.toResponse(updatedInvoice);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error updating inspection invoice',
      });
    }
  }
}
