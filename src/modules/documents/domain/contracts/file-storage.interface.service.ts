export interface StoredFileResult {
  fileUrl: string;
  mimeType: string;
  sizeInBytes: number;
  hashSha256: string;
}

export interface InterfaceFileStorageService {
  saveFile(
    fileBase64: string,
    originalName: string,
    mimeType?: string,
  ): Promise<StoredFileResult>;
}
