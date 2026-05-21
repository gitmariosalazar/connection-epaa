import { Inject, Injectable } from '@nestjs/common';
import { CreateInspectionInvoiceRequest } from '../dto/request/create-inspection-invoice.request';
import { InspectionInvoiceResponse } from '../dto/response/inspection-invoice.response';
import { InterfaceInspectionInvoiceRepository } from '../../domain/contracts/inspection-invoice.interface.repository';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../settings/environments/status-code';
import { validateFields } from '../../../../shared/validators/fields.validators';
import { InspectionInvoiceMapper } from '../mappers/inspection-invoice.mapper';
import { InspectionInvoiceModel } from '../../domain/schemas/models/InspectionInvoiceModel';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

@Injectable()
export class CreateInspectionInvoiceUseCase {
  constructor(
    @Inject('InterfaceInspectionInvoiceRepository')
    private readonly inspectionInvoiceRepository: InterfaceInspectionInvoiceRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(
    request: CreateInspectionInvoiceRequest,
  ): Promise<InspectionInvoiceResponse> {
    try {
      const fiellRequired: string[] = [
        'requestId',
        'invoiceNumber',
        'conceptId',
        'amount',
        'expirationDate',
      ];

      const missingFields: string[] = validateFields(request, fiellRequired);

      if (missingFields.length > 0) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: missingFields,
        });
      }

      const inspectionInvoiceModel: InspectionInvoiceModel =
        InspectionInvoiceMapper.toModel(request);

      const createdInvoice =
        await this.inspectionInvoiceRepository.createInspectionInvoice(
          inspectionInvoiceModel,
        );

      if (!createdInvoice) {
        throw new RpcException({
          statusCode: statusCode.BAD_REQUEST,
          message: 'Failed to create inspection invoice',
        });
      }

      // Fase 10 — Notificar al cliente que tiene una factura pendiente de pago
      const clientId = await this.inspectionInvoiceRepository.getClientIdBySolicitud(
        request.requestId,
      );
      if (clientId) {
        this.notification.notifyFacturaEmitida(
          clientId,
          request.requestId,
          request.amount,
          request.invoiceNumber,
        );
      }

      return InspectionInvoiceMapper.toResponse(createdInvoice);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error creating inspection invoice',
      });
    }
  }
}
