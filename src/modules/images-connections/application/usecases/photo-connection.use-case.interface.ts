import { CreatePhotoConnectionRequest } from "../../domain/schemas/dto/request/create.photo-connection.request";
import { PhotoConnectionResponse } from "../../domain/schemas/dto/response/photo-connection.response";

export interface InterfacePhotoConnectionUseCase {
  createPhotoConnection(photoConnection: CreatePhotoConnectionRequest): Promise<PhotoConnectionResponse | null>;
  getPhotoConnectionsByCadastralKey(cadastralKey: string): Promise<PhotoConnectionResponse[]>;
}