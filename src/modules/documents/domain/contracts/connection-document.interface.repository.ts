import { ConnectionDocumentModel } from '../schemas/models/ConnectionDocumentModel';

export interface InterfaceConnectionDocumentRepository {
  createConnectionDocument(
    document: ConnectionDocumentModel,
  ): Promise<ConnectionDocumentModel | null>;
  updateConnectionDocument(
    documentId: string,
    document: Partial<ConnectionDocumentModel>,
  ): Promise<ConnectionDocumentModel | null>;
  getConnectionDocumentById(
    documentId: string,
  ): Promise<ConnectionDocumentModel | null>;
  findAllConnectionDocumentsByRequestId(
    requestId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentModel[]>;
  findAllConnectionDocuments(
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentModel[]>;
  findAllConnectionDocumentsByClientId(
    clientId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentModel[]>;
  deleteConnectionDocument(documentId: string): Promise<boolean>;
}
