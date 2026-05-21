import { ConnectionDocumentResponse } from '../../application/dto/response/connection-document.response';
import { ConnectionDocumentModel } from '../../domain/schemas/models/ConnectionDocumentModel';
import { ConnectionDocumentSQLResult } from '../interfaces/sql/connection-document.sql.result';

export class ConnectionDocumentAdapter {
  static toResponse(
    document: ConnectionDocumentModel,
  ): ConnectionDocumentResponse {
    return {
      documentId: document.documentId,
      requestId: document.requestId,
      documentTypeId: document.documentTypeId,
      fileUrl: document.fileUrl,
      originalName: document.originalName,
      mimeType: document.mimeType,
      sizeInBytes: document.sizeInBytes,
      hashSha256: document.hashSha256,
      validationStatus: document.validationStatus,
      observation: document.observation,
      validatorId: document.validatorId || null, // Handle null case for validatorId
      validationDate: document.validationDate,
      isDeleted: document.isDeleted,
      deletedAt: document.deletedAt || null, // Handle null case for deletedAt
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  static fromConnectionDocumentSQLResultToModel(
    sqlResult: ConnectionDocumentSQLResult,
  ): ConnectionDocumentModel {
    return new ConnectionDocumentModel(
      sqlResult.document_id,
      sqlResult.request_id,
      sqlResult.document_type_id,
      sqlResult.file_url,
      sqlResult.original_name,
      sqlResult.mime_type,
      sqlResult.size_in_bytes,
      sqlResult.hash_sha256,
      sqlResult.validation_status,
      sqlResult.observation,
      sqlResult.validator_id,
      sqlResult.validation_date ? new Date(sqlResult.validation_date) : null, // Handle null case for validationDate
      sqlResult.is_deleted,
      sqlResult.deleted_at ? new Date(sqlResult.deleted_at) : null, // Handle null case for deletedAt
      new Date(sqlResult.created_at),
      new Date(sqlResult.updated_at),
    );
  }
}
