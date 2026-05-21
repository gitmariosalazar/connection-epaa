import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeleteConnectionRequestUseCase } from '../../application/usecases/commands/DeleteConnectionRequestUseCase';
import { UpdateRequestUseCase } from '../../application/usecases/commands/UpdateRequestUseCase';
import { FindAllConnectionRequestsUseCase } from '../../application/usecases/commands/FindAllConnectionRequestsUseCase';
import { GetConnectionRequestByIdUseCase } from '../../application/usecases/commands/GetConnectionRequestByIdUseCase';
import { CreateRequestUseCase } from '../../application/usecases/commands/CreateRequestUseCase';
import { GetExpedienteUseCase } from '../../application/usecases/commands/GetExpedienteUseCase';
import { GetHistorialEstadoUseCase } from '../../application/usecases/commands/GetHistorialEstadoUseCase';
import { GetDashboardKpisUseCase } from '../../application/usecases/commands/GetDashboardKpisUseCase';
import { GetOrdenesTrabajoUseCase } from '../../application/usecases/commands/GetOrdenesTrabajoUseCase';
import { SubmitRequestUseCase } from '../../application/usecases/commands/SubmitRequestUseCase';
import { SubmitWithDocumentsUseCase } from '../../application/usecases/commands/SubmitWithDocumentsUseCase';
import { SubmitWithDocumentsRequest } from '../../application/dto/request/submit-with-documents.request';
import { RequestResponse } from '../../application/dto/response/request.response';
import { CreateRequestRequest } from '../../application/dto/request/create-request.request';
import { UpdateRequestRequest } from '../../application/dto/request/update-request.request';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('requests')
export class RequestController {
  constructor(
    private readonly createRequestUseCase: CreateRequestUseCase,
    private readonly getConnectionRequestByIdUseCase: GetConnectionRequestByIdUseCase,
    private readonly findAllConnectionRequestsUseCase: FindAllConnectionRequestsUseCase,
    private readonly updateRequestUseCase: UpdateRequestUseCase,
    private readonly deleteConnectionRequestUseCase: DeleteConnectionRequestUseCase,
    private readonly getExpedienteUseCase: GetExpedienteUseCase,
    private readonly getHistorialEstadoUseCase: GetHistorialEstadoUseCase,
    private readonly getDashboardKpisUseCase: GetDashboardKpisUseCase,
    private readonly getOrdenesTrabajoUseCase: GetOrdenesTrabajoUseCase,
    private readonly submitRequestUseCase: SubmitRequestUseCase,
    private readonly submitWithDocumentsUseCase: SubmitWithDocumentsUseCase,
  ) {}

  @Post()
  @MessagePattern('requests.create_request')
  async createRequest(
    @Payload() createRequestDto: CreateRequestRequest,
  ): Promise<RequestResponse> {
    return await this.createRequestUseCase.execute(createRequestDto);
  }

  @Get(':id')
  @MessagePattern('requests.get_request_by_id')
  async getRequestById(
    @Payload() requestId: string,
  ): Promise<RequestResponse | null> {
    return await this.getConnectionRequestByIdUseCase.execute(requestId);
  }

  @Get()
  @MessagePattern('requests.get_all_requests')
  async getAllRequests(
    @Payload() payload: { limit: number; offset: number; status?: string },
  ): Promise<RequestResponse[]> {
    return await this.findAllConnectionRequestsUseCase.execute(
      payload.limit,
      payload.offset,
      payload.status,
    );
  }

  @Put(':requestId')
  @MessagePattern('requests.update_request')
  async updateRequest(
    @Payload()
    payload: {
      requestId: string;
      updateData: Partial<UpdateRequestRequest>;
    },
  ): Promise<RequestResponse | null> {
    return await this.updateRequestUseCase.execute(
      payload.requestId,
      payload.updateData,
    );
  }

  @Delete(':requestId')
  @MessagePattern('requests.delete_request')
  async deleteRequest(
    @Payload() requestId: string,
  ): Promise<{ success: boolean }> {
    const result = await this.deleteConnectionRequestUseCase.execute(requestId);
    return { success: result };
  }

  // ── Consultas enriquecidas para el frontend ──────────────────────────────

  @Get(':solicitudId/expediente')
  @MessagePattern('requests.get_expediente')
  async getExpediente(@Payload() solicitudId: string) {
    return await this.getExpedienteUseCase.execute(solicitudId);
  }

  @Get(':solicitudId/historial')
  @MessagePattern('requests.get_historial')
  async getHistorial(@Payload() solicitudId: string) {
    return await this.getHistorialEstadoUseCase.execute(solicitudId);
  }

  @Get('dashboard/kpis')
  @MessagePattern('requests.get_dashboard_kpis')
  async getDashboardKpis() {
    return await this.getDashboardKpisUseCase.execute();
  }

  @Get(':solicitudId/ordenes-trabajo')
  @MessagePattern('requests.get_ordenes_trabajo')
  async getOrdenesTrabajo(@Payload() solicitudId: string) {
    return await this.getOrdenesTrabajoUseCase.execute(solicitudId);
  }

  /**
   * Fase 2: Enviar solicitud (DRAFT → DOCS_SUBMITTED)
   * El cliente confirma que sus documentos están listos para revisión.
   */
  @Post(':solicitudId/submit')
  @MessagePattern('requests.submit_request')
  async submitRequest(
    @Payload() payload: { solicitudId: string; clientId: string },
  ) {
    return await this.submitRequestUseCase.execute(
      payload.solicitudId,
      payload.clientId,
    );
  }

  /**
   * OPERACIÓN ATÓMICA: Crear + Documentos + DOCS_SUBMITTED en una transacción.
   * Elimina la necesidad de 3 llamadas separadas desde el frontend.
   * Si cualquier paso falla → ROLLBACK total en PostgreSQL.
   */
  @Post('submit-with-documents')
  @MessagePattern('requests.submit_with_documents')
  async submitWithDocuments(
    @Payload() dto: SubmitWithDocumentsRequest,
  ) {
    return await this.submitWithDocumentsUseCase.execute(dto);
  }
}
