import { PhotoConnectionResponse } from "../schemas/dto/response/photo-connection.response";
import { PhotoConnectionModel } from "../schemas/model/photo-connection.model";

export interface InterfacePhotoConnectionRepository {
  createPhotoConnection(photoConnection: PhotoConnectionModel): Promise<PhotoConnectionResponse | null>;
  getPhotoConnectionsByCadastralKey(cadastralKey: string): Promise<PhotoConnectionResponse[]>;
}