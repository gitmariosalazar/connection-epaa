export class CreatePhotoConnectionRequest {
  connectionId: string;
  photoUrl: string;
  description?: string;

  constructor(
    connectionId: string,
    photoUrl: string,
    description?: string
  ) {
    this.connectionId = connectionId;
    this.photoUrl = photoUrl;
    this.description = description;
  }
}