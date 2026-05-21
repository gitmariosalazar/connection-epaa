import { Controller, Post, Put } from '@nestjs/common';
import { DeleteConnectionDocumentUseCase } from '../../application/usecases/DeleteConnectionDocumentUseCase';
import { UpdateConnectionDocumentUseCase } from '../../application/usecases/UpdateConnectionDocumentUseCase';
import { GetConnectionDocumentByIdUseCase } from '../../application/usecases/GetConnectionDocumentByIdUseCase';
import { FindAllConnectionDocumentsUseCase } from '../../application/usecases/FindAllConnectionDocumentsUseCase';
import { CreateConnectionDocumentUseCase } from '../../application/usecases/CreateConnectionDocumentUseCase';
import { FindAllConnectionDocumentsByClientIdUseCase } from '../../application/usecases/FindAllConnectionDocumentsByClientIdUseCase';
import { FindAllConnectionDocumentsByRequestIdUseCase } from '../../application/usecases/FindAllConnectionDocumentsByRequestIdUseCase';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateConnectionDocumentRequest } from '../../application/dto/request/create-connection-document.request';
import { UpdateConnectionDocumentRequest } from '../../application/dto/request/update-connection-document.request';
import { ConnectionDocumentResponse } from '../../application/dto/response/connection-document.response';

@Controller('connection-documents')
export class ConnectionDocumentController {
  constructor(
    private readonly createConnectionDocumentUseCase: CreateConnectionDocumentUseCase,
    private readonly findAllConnectionDocumentsUseCase: FindAllConnectionDocumentsUseCase,
    private readonly getConnectionDocumentByIdUseCase: GetConnectionDocumentByIdUseCase,
    private readonly updateConnectionDocumentUseCase: UpdateConnectionDocumentUseCase,
    private readonly deleteConnectionDocumentUseCase: DeleteConnectionDocumentUseCase,
    private readonly findAllConnectionDocumentsByClientIdUseCase: FindAllConnectionDocumentsByClientIdUseCase,
    private readonly findAllConnectionDocumentsByRequestIdUseCase: FindAllConnectionDocumentsByRequestIdUseCase,
  ) {}

  @Post('create')
  @MessagePattern('connection-documents.create')
  async createConnectionDocument(
    @Payload() createDocument: CreateConnectionDocumentRequest,
  ): Promise<ConnectionDocumentResponse | null> {
    // Implement the logic to handle the creation of a connection document
    return await this.createConnectionDocumentUseCase.execute(createDocument);
  }

  @Put(':documentId')
  @MessagePattern('connection-documents.update')
  async updateConnectionDocument(
    @Payload()
    payload: {
      documentId: string;
      updateData: Partial<UpdateConnectionDocumentRequest>;
    },
  ): Promise<ConnectionDocumentResponse | null> {
    // Implement the logic to handle the update of a connection document
    return await this.updateConnectionDocumentUseCase.execute(
      payload.documentId,
      payload.updateData,
    );
  }

  @MessagePattern('connection-documents.get_by_id')
  async getConnectionDocumentById(
    @Payload() documentId: string,
  ): Promise<ConnectionDocumentResponse | null> {
    // Implement the logic to retrieve a connection document by its ID
    return await this.getConnectionDocumentByIdUseCase.execute(documentId);
  }

  @MessagePattern('connection-documents.get_all')
  async getAllConnectionDocuments(
    @Payload() payload: { limit: number; offset: number },
  ): Promise<ConnectionDocumentResponse[]> {
    // Implement the logic to retrieve all connection documents with pagination
    return await this.findAllConnectionDocumentsUseCase.execute(
      payload.limit,
      payload.offset,
    );
  }

  @MessagePattern('connection-documents.get_by_client_id')
  async getConnectionDocumentsByClientId(
    @Payload() payload: { clientId: string; limit: number; offset: number },
  ): Promise<ConnectionDocumentResponse[]> {
    // Implement the logic to retrieve connection documents by client ID with pagination
    return await this.findAllConnectionDocumentsByClientIdUseCase.execute(
      payload.clientId,
      payload.limit,
      payload.offset,
    );
  }

  @MessagePattern('connection-documents.get_by_request_id')
  async getConnectionDocumentsByRequestId(
    @Payload() payload: { requestId: string; limit: number; offset: number },
  ): Promise<ConnectionDocumentResponse[]> {
    // Implement the logic to retrieve connection documents by request ID with pagination
    return await this.findAllConnectionDocumentsByRequestIdUseCase.execute(
      payload.requestId,
      payload.limit,
      payload.offset,
    );
  }

  @MessagePattern('connection-documents.delete')
  async deleteConnectionDocument(
    @Payload() documentId: string,
  ): Promise<{ success: boolean }> {
    // Implement the logic to handle the deletion of a connection document
    const result =
      await this.deleteConnectionDocumentUseCase.execute(documentId);
    return { success: result };
  }
}
