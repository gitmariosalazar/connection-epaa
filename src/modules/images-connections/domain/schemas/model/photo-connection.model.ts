export class PhotoConnectionModel {
  private photoConnectionId?: number;
  private connectionId: string;
  private photoUrl: string;
  private description?: string;
  private createdAt?: Date;
  private updatedAt?: Date;

  constructor(
    connectionId: string,
    photoUrl: string,
    description?: string,
    photoConnectionId?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.photoConnectionId = photoConnectionId;
    this.connectionId = connectionId;
    this.photoUrl = photoUrl;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public getPhotoConnectionId(): number | undefined {
    return this.photoConnectionId;
  }

  public getConnectionId(): string {
    return this.connectionId;
  }

  public getPhotoUrl(): string {
    return this.photoUrl;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public setPhotoUrl(photoUrl: string): void {
    this.photoUrl = photoUrl;
  }

  public setUpdatedAt(updatedAt: Date): void {
    this.updatedAt = updatedAt;
  }

  public setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }

}
