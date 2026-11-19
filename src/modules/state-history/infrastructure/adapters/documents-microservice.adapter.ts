import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  IDocumentService,
  UploadEvidenceInput,
  UploadEvidenceOutput,
} from '../../domain/contracts/document-service.interface';
import { statusCode } from '../../../../settings/environments/status-code';

@Injectable()
export class DocumentsMicroserviceAdapter implements IDocumentService {
  private readonly logger: Logger = new Logger(
    DocumentsMicroserviceAdapter.name,
  );

  private readonly documentsApiUrl =
    process.env.DOCUMENTS_SERVICE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'http://documents-service:3019'
      : 'http://documents-service-dev:4019');

  async uploadEvidence(
    input: UploadEvidenceInput,
  ): Promise<UploadEvidenceOutput> {
    try {
      this.logger.log(
        `📤 [HTTP -> DOCUMENTS-SERVICE] Subiendo evidencia "${input.fileName}" (${input.mimeType}) para acometida ${input.connectionId} hacia ${this.documentsApiUrl}`,
      );

      const formData = new FormData();
      const fileBlob = new Blob([new Uint8Array(input.buffer)], {
        type: input.mimeType,
      });
      formData.append('file', fileBlob, input.fileName);
      formData.append('codigoTipoDocumento', input.tipoDocumento);
      formData.append('entityType', 'acometida');
      formData.append('entityId', input.connectionId);
      formData.append('uploadedBy', input.userId);
      formData.append('nivelAcceso', 'PRIVADO');

      if (input.observaciones) {
        formData.append(
          'metadatosExtras',
          JSON.stringify({ observaciones: input.observaciones }),
        );
      }

      const response = await fetch(`${this.documentsApiUrl}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `❌ Error respuesta de documents-service: HTTP ${response.status} - ${errorBody}`,
        );
        throw new Error(
          `Documents service rejected upload (HTTP ${response.status}): ${errorBody}`,
        );
      }

      const body = (await response.json()) as any;
      const documentId =
        body.documento?.documento_id || body.documento_id || body.id;

      if (!documentId) {
        throw new Error('Respuesta inválida: falta el ID del documento.');
      }

      const documentUrl =
        body.uploadUrl ||
        body.downloadUrl ||
        body.documento?.storage_path ||
        body.storage_path ||
        '';

      this.logger.log(
        `✅ [DOCUMENTS-SERVICE -> HTTP] Archivo registrado exitosamente. Documento ID: ${documentId}`,
      );

      return {
        documentId: String(documentId),
        documentUrl: String(documentUrl),
      };
    } catch (error) {
      this.logger.error(
        `❌ Fallo de comunicación con el microservicio de documentos: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new RpcException({
        statusCode: statusCode.BAD_GATEWAY,
        message: `Fallo al procesar documento de respaldo: ${(error as Error).message}`,
      });
    }
  }
}
