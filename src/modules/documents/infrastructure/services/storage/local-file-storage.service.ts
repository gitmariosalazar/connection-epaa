import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import {
  InterfaceFileStorageService,
  StoredFileResult,
} from '../../../domain/contracts/file-storage.interface.service';
import { statusCode } from '../../../../../settings/environments/status-code';
import { environments } from '../../../../../settings/environments/environments';

@Injectable()
export class LocalFileStorageService implements InterfaceFileStorageService {
  private readonly diskUploadDir: string =
    environments.CONNECTION_DOCUMENTS_UPLOAD_DIR ??
    join(process.cwd(), 'uploads', 'connection-documents');
  private readonly publicUploadPrefix = '/uploads/connection-documents';

  async saveFile(
    fileBase64: string,
    originalName: string,
    mimeType?: string,
  ): Promise<StoredFileResult> {
    const { buffer, mimeTypeFromPayload } = this.decodeFileBase64(fileBase64);
    const finalMimeType =
      mimeTypeFromPayload ?? mimeType ?? 'application/octet-stream';
    const fileName = this.buildFileName(originalName, finalMimeType);

    await mkdir(this.diskUploadDir, { recursive: true });
    await writeFile(join(this.diskUploadDir, fileName), buffer);

    return {
      fileUrl: `${this.publicUploadPrefix}/${fileName}`,
      mimeType: finalMimeType,
      sizeInBytes: buffer.byteLength,
      hashSha256: createHash('sha256').update(buffer).digest('hex'),
    };
  }

  private buildFileName(originalName: string, mimeType: string): string {
    const safeBaseName = basename(originalName || 'document')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');

    const extension =
      extname(safeBaseName) || this.extensionFromMimeType(mimeType);
    return `${Date.now()}-${randomUUID()}${extension}`;
  }

  private extensionFromMimeType(mimeType: string): string {
    const knownExtensions: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'text/plain': '.txt',
      'application/zip': '.zip',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        '.xlsx',
    };

    return knownExtensions[mimeType] ?? '';
  }

  private decodeFileBase64(fileBase64: string): {
    buffer: Buffer;
    mimeTypeFromPayload?: string;
  } {
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'fileBase64 is required to upload a file',
      });
    }

    const trimmedValue = fileBase64.trim();
    const dataUrlMatch = trimmedValue.match(/^data:([^;]+);base64,(.+)$/i);

    let payload = trimmedValue;
    let mimeTypeFromPayload: string | undefined;

    if (dataUrlMatch) {
      mimeTypeFromPayload = dataUrlMatch[1];
      payload = dataUrlMatch[2];
    }

    try {
      const buffer = Buffer.from(payload, 'base64');
      if (!buffer.length) {
        throw new Error('empty file');
      }
      return { buffer, mimeTypeFromPayload };
    } catch {
      throw new RpcException({
        statusCode: statusCode.BAD_REQUEST,
        message: 'Invalid base64 file content',
      });
    }
  }
}
