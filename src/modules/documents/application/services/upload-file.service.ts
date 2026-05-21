import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  InterfaceFileStorageService,
  StoredFileResult,
} from '../../domain/contracts/file-storage.interface.service';
import { statusCode } from '../../../../settings/environments/status-code';

interface UploadDocumentInput {
  fileBase64?: string;
  fileUrl?: string;
  originalName: string;
  mimeType?: string;
  sizeInBytes?: number;
  hashSha256?: string;
}

@Injectable()
export class UploadFileService {
  constructor(
    @Inject('InterfaceFileStorageService')
    private readonly fileStorageService: InterfaceFileStorageService,
  ) {}

  async uploadDocument(input: UploadDocumentInput): Promise<StoredFileResult> {
    if (input.fileBase64) {
      return this.fileStorageService.saveFile(
        input.fileBase64,
        input.originalName,
        input.mimeType,
      );
    }

    const hasMetadata =
      !!input.fileUrl &&
      !!input.mimeType &&
      !!input.hashSha256 &&
      typeof input.sizeInBytes === 'number' &&
      input.sizeInBytes >= 0;

    if (hasMetadata) {
      return {
        fileUrl: input.fileUrl!,
        mimeType: input.mimeType!,
        sizeInBytes: input.sizeInBytes!,
        hashSha256: input.hashSha256!,
      };
    }

    throw new RpcException({
      statusCode: statusCode.BAD_REQUEST,
      message:
        'You must send either fileBase64, or fileUrl + mimeType + sizeInBytes + hashSha256',
    });
  }
}
