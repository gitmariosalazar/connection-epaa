import { Controller } from '@nestjs/common';
import { FindAllInspectionInvoicesByRequestIdUseCase } from '../../application/usecases/FindAllInspectionInvoicesByRequestIdUseCase';
import { FindAllInspectionInvoicesUseCase } from '../../application/usecases/FindAllInspectionInvoicesUseCase';
import { GetInspectionInvoiceByIdUseCase } from '../../application/usecases/GetInspectionInvoiceByIdUseCase';
import { CreateInspectionInvoiceUseCase } from '../../application/usecases/CreateInspectionInvoiceUseCase';
import { UpdateInspectionInvoiceUseCase } from '../../application/usecases/UpdateInspectionInvoiceUseCase';
import { DeleteInspectionInvoiceUseCase } from '../../application/usecases/DeleteInspectionInvoiceUseCase';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateInspectionInvoiceRequest } from '../../application/dto/request/create-inspection-invoice.request';
import { UpdateInspectionInvoiceRequest } from '../../application/dto/request/update-inspection-invoice.request';

@Controller('inspection-invoice')
export class InspectionInvoiceController {
  // Implement your controller methods here
  constructor(
    private readonly createInspectionInvoiceUseCase: CreateInspectionInvoiceUseCase,
    private readonly getInspectionInvoiceByIdUseCase: GetInspectionInvoiceByIdUseCase,
    private readonly findAllInspectionInvoicesUseCase: FindAllInspectionInvoicesUseCase,
    private readonly findAllInspectionInvoicesByRequestIdUseCase: FindAllInspectionInvoicesByRequestIdUseCase,
    private readonly deleteInspectionInvoiceUseCase: DeleteInspectionInvoiceUseCase,
    private readonly updateInspectionInvoiceUseCase: UpdateInspectionInvoiceUseCase,
  ) {}

  @MessagePattern('inspection-invoice.create')
  async createInspectionInvoice(
    @Payload() data: CreateInspectionInvoiceRequest,
  ) {
    return this.createInspectionInvoiceUseCase.execute(data);
  }

  @MessagePattern('inspection-invoice.getById')
  async getInspectionInvoiceById(@Payload() invoiceId: string) {
    return this.getInspectionInvoiceByIdUseCase.execute(invoiceId);
  }

  @MessagePattern('inspection-invoice.findAll')
  async findAllInspectionInvoices(
    @Payload() pagination: { limit: number; offset: number },
  ) {
    return this.findAllInspectionInvoicesUseCase.execute(
      pagination.limit,
      pagination.offset,
    );
  }

  @MessagePattern('inspection-invoice.findAllByRequestId')
  async findAllInspectionInvoicesByRequestId(
    @Payload() data: { requestId: string; limit: number; offset: number },
  ) {
    return this.findAllInspectionInvoicesByRequestIdUseCase.execute(
      data.requestId,
      data.limit,
      data.offset,
    );
  }

  @MessagePattern('inspection-invoice.delete')
  async deleteInspectionInvoice(@Payload() invoiceId: string) {
    return this.deleteInspectionInvoiceUseCase.execute(invoiceId);
  }

  @MessagePattern('inspection-invoice.update')
  async updateInspectionInvoice(
    @Payload()
    data: {
      invoiceId: string;
      updateData: Partial<UpdateInspectionInvoiceRequest>;
    },
  ) {
    return this.updateInspectionInvoiceUseCase.execute(
      data.invoiceId,
      data.updateData,
    );
  }
}
