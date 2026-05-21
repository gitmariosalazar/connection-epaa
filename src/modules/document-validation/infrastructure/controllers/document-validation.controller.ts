import { Controller, Param, Patch, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ValidateDocumentsUseCase } from '../../application/usecases/ValidateDocumentsUseCase';
import { ValidateDocumentsRequest } from '../../application/dto/request/validate-documents.request';

@Controller('document-validation')
export class DocumentValidationController {
  constructor(
    private readonly validateDocumentsUseCase: ValidateDocumentsUseCase,
  ) {}

  /**
   * FASE 3: Validación Documental
   * PATCH /document-validation/solicitudes/:solicitudId/validar
   */
  @Patch('solicitudes/:solicitudId/validar')
  @MessagePattern('document_validation.validate_documents')
  async validateDocuments(
    @Payload()
    payload: {
      solicitudId: string;
      dto: ValidateDocumentsRequest;
    },
  ) {
    return await this.validateDocumentsUseCase.execute(
      payload.solicitudId,
      payload.dto,
    );
  }
}
