import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceConnectionDocumentRepository } from '../../../../domain/contracts/connection-document.interface.repository';
import { ConnectionDocumentModel } from '../../../../domain/schemas/models/ConnectionDocumentModel';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { RpcException } from '@nestjs/microservices/exceptions/rpc-exception';
import { ConnectionDocumentSQLResult } from '../../../interfaces/sql/connection-document.sql.result';
import { ConnectionDocumentAdapter } from '../../../adapters/connection-document.adapter';

@Injectable()
export class ConnectionDocumentPostgreSQLPersistence implements InterfaceConnectionDocumentRepository {
  // Implement your PostgreSQL persistence logic here
  constructor(private readonly databaseSService: DatabaseAbstract) {}

  async createConnectionDocument(
    document: ConnectionDocumentModel,
  ): Promise<ConnectionDocumentModel | null> {
    try {
      const query: string = `
      INSERT INTO acometidas.documento_adjunto (  
        id_solicitud, id_tipo_documento, url_archivo, nombre_original, mime_type, tamano_bytes, hash_sha256, estado_validacion, observacion, id_validador, fecha_validacion
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning
        id_documento AS document_id,
        id_solicitud AS request_id,
        id_tipo_documento AS document_type_id,
        url_archivo AS file_url,
        nombre_original AS original_name,
        mime_type AS mime_type,
        tamano_bytes AS size_in_bytes,
        hash_sha256 AS hash_sha256,
        estado_validacion AS validation_status,
        observacion AS observation,
        id_validador AS validator_id,
        fecha_validacion AS validation_date,
        is_deleted AS is_deleted,
        deleted_at AS deleted_at,
        created_at AS created_at,
        updated_at AS updated_at
    ;
      `;

      const values = [
        document.requestId,
        document.documentTypeId,
        document.fileUrl,
        document.originalName,
        document.mimeType,
        document.sizeInBytes,
        document.hashSha256,
        document.validationStatus,
        document.observation,
        document.validatorId,
        document.validationDate,
      ];

      const result =
        await this.databaseSService.query<ConnectionDocumentSQLResult>(
          query,
          values,
        );

      if (result.length === 0) {
        return null;
      }

      const createdDocument = result[0];
      return ConnectionDocumentAdapter.fromConnectionDocumentSQLResultToModel(
        createdDocument,
      ); // Adjust this as needed based on your database schema and requirements
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error creating connection document',
      });
    }
  }

  async updateConnectionDocument(
    documentId: string,
    document: Partial<ConnectionDocumentModel>,
  ): Promise<ConnectionDocumentModel | null> {
    try {
      // Build your update query based on the fields provided in the document parameter
      const existingDocument = await this.getConnectionDocumentById(documentId);

      if (!existingDocument) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'Connection document not found',
        });
      }

      const updatedData = {
        ...existingDocument,
        ...document,
      };

      // Implement the logic to update the document in the database using updatedData
      // You will need to construct an UPDATE SQL query based on the fields that are being updated
      // After updating, return the updated document model
      // For example:
      const query: string = `
        UPDATE acometidas.documento_adjunto
        SET
          id_solicitud = $1,
          id_tipo_documento = $2,
          url_archivo = $3,
          nombre_original = $4,
          mime_type = $5,
          tamano_bytes = $6,
          hash_sha256 = $7,
          estado_validacion = $8,
          observacion = $9,
          id_validador = $10,
          fecha_validacion = $11,
          is_deleted = $12,
          deleted_at = $13,
          created_at = $14,
          updated_at = NOW()
        WHERE id_documento = $15
        RETURNING
          id_documento AS document_id,
          id_solicitud AS request_id,
          id_tipo_documento AS document_type_id,
          url_archivo AS file_url,
          nombre_original AS original_name,
          mime_type AS mime_type,
          tamano_bytes AS size_in_bytes,
          hash_sha256 AS hash_sha256,
          estado_validacion AS validation_status,
          observacion AS observation,
          id_validador AS validator_id,
          fecha_validacion AS validation_date,
          is_deleted AS is_deleted,
          deleted_at AS deleted_at,
          created_at AS created_at,
          updated_at AS updated_at
      ;
      `;

      const values = [
        updatedData.requestId,
        updatedData.documentTypeId,
        updatedData.fileUrl,
        updatedData.originalName,
        updatedData.mimeType,
        updatedData.sizeInBytes,
        updatedData.hashSha256,
        updatedData.validationStatus,
        updatedData.observation,
        updatedData.validatorId,
        updatedData.validationDate,
        updatedData.isDeleted,
        updatedData.deletedAt,
        existingDocument.createdAt, // Keep the original createdAt
        documentId, // WHERE clause parameter
      ];

      const result =
        await this.databaseSService.query<ConnectionDocumentSQLResult>(
          query,
          values,
        );

      if (result.length === 0) {
        return null;
      }

      const updatedDocument = result[0];
      return ConnectionDocumentAdapter.fromConnectionDocumentSQLResultToModel(
        updatedDocument,
      ); // Adjust this as needed based on your database schema and requirements
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error updating connection document',
      });
    }
  }

  async getConnectionDocumentById(
    documentId: string,
  ): Promise<ConnectionDocumentModel | null> {
    try {
      const query: string = `
        SELECT
          id_documento AS document_id,
          id_solicitud AS request_id,
          id_tipo_documento AS document_type_id,
          url_archivo AS file_url,
          nombre_original AS original_name,
          mime_type AS mime_type,
          tamano_bytes AS size_in_bytes,
          hash_sha256 AS hash_sha256,
          estado_validacion AS validation_status,
          observacion AS observation,
          id_validador AS validator_id,
          fecha_validacion AS validation_date,
          is_deleted AS is_deleted,
          deleted_at AS deleted_at,
          created_at AS created_at,
          updated_at AS updated_at
        FROM acometidas.documento_adjunto
        WHERE id_documento = $1
      `;

      const values = [documentId];

      const result =
        await this.databaseSService.query<ConnectionDocumentSQLResult>(
          query,
          values,
        );

      if (result.length === 0) {
        return null;
      }

      const document = result[0];
      return ConnectionDocumentAdapter.fromConnectionDocumentSQLResultToModel(
        document,
      ); // Adjust this as needed based on your database schema and requirements
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving connection document',
      });
    }
  }

  async findAllConnectionDocuments(
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentModel[]> {
    try {
      const query: string = `
        SELECT
          id_documento AS document_id,
          id_solicitud AS request_id,
          id_tipo_documento AS document_type_id,
          url_archivo AS file_url,
          nombre_original AS original_name,
          mime_type AS mime_type,
          tamano_bytes AS size_in_bytes,
          hash_sha256 AS hash_sha256,
          estado_validacion AS validation_status,
          observacion AS observation,
          id_validador AS validator_id,
          fecha_validacion AS validation_date,
          is_deleted AS is_deleted,
          deleted_at AS deleted_at,
          created_at AS created_at,
          updated_at AS updated_at
        FROM acometidas.documento_adjunto
        WHERE is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const values = [limit, offset];

      const result =
        await this.databaseSService.query<ConnectionDocumentSQLResult>(
          query,
          values,
        );

      return result.map((document) =>
        ConnectionDocumentAdapter.fromConnectionDocumentSQLResultToModel(
          document,
        ),
      ); // Adjust this as needed based on your database schema and requirements
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving connection documents',
      });
    }
  }

  async findAllConnectionDocumentsByClientId(
    clientId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentModel[]> {
    try {
      const query: string = `
        SELECT
          da.id_documento AS document_id,
          da.id_solicitud AS request_id,
          da.id_tipo_documento AS document_type_id,
          da.url_archivo AS file_url,
          da.nombre_original AS original_name,
          da.mime_type AS mime_type,
          da.tamano_bytes AS size_in_bytes,
          da.hash_sha256 AS hash_sha256,
          da.estado_validacion AS validation_status,
          da.observacion AS observation,
          da.id_validador AS validator_id,
          da.fecha_validacion AS validation_date,
          da.is_deleted AS is_deleted,
          da.deleted_at AS deleted_at,
          da.created_at AS created_at,
          da.updated_at AS updated_at
        FROM acometidas.documento_adjunto da
        JOIN acometidas.solicitud s ON da.id_solicitud = s.id_solicitud
        WHERE s.id_cliente = $1 AND da.is_deleted = FALSE
        ORDER BY da.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const values = [clientId, limit, offset];

      const result =
        await this.databaseSService.query<ConnectionDocumentSQLResult>(
          query,
          values,
        );

      return result.map((document) =>
        ConnectionDocumentAdapter.fromConnectionDocumentSQLResultToModel(
          document,
        ),
      ); // Adjust this as needed based on your database schema and requirements
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving connection documents by client ID',
      });
    }
  }

  async findAllConnectionDocumentsByRequestId(
    requestId: string,
    limit: number,
    offset: number,
  ): Promise<ConnectionDocumentModel[]> {
    try {
      const query: string = `
        SELECT
          id_documento AS document_id,
          id_solicitud AS request_id,
          id_tipo_documento AS document_type_id,
          url_archivo AS file_url,
          nombre_original AS original_name,
          mime_type AS mime_type,
          tamano_bytes AS size_in_bytes,
          hash_sha256 AS hash_sha256,
          estado_validacion AS validation_status,
          observacion AS observation,
          id_validador AS validator_id,
          fecha_validacion AS validation_date,
          is_deleted AS is_deleted,
          deleted_at AS deleted_at,
          created_at AS created_at,
          updated_at AS updated_at
        FROM acometidas.documento_adjunto
        WHERE id_solicitud = $1 AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const values = [requestId, limit, offset];

      const result =
        await this.databaseSService.query<ConnectionDocumentSQLResult>(
          query,
          values,
        );

      return result.map((document) =>
        ConnectionDocumentAdapter.fromConnectionDocumentSQLResultToModel(
          document,
        ),
      ); // Adjust this as needed based on your database schema and requirements
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving connection documents by request ID',
      });
    }
  }

  async deleteConnectionDocument(documentId: string): Promise<boolean> {
    try {
      const query: string = `
        UPDATE acometidas.documento_adjunto
        SET 
          is_deleted = TRUE,
          deleted_at = NOW()
        WHERE id_documento = $1 AND is_deleted = FALSE;
      `;

      const values = [documentId];

      const result = await this.databaseSService.execute(query, values);

      return result.affectedRows > 0; // Adjust this based on how your database client returns the result of an UPDATE operation
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: statusCode.INTERNAL_SERVER_ERROR,
        message: 'Error deleting connection document',
      });
    }
  }
}
