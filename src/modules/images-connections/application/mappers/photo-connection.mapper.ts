import { CreatePhotoConnectionRequest } from "../../domain/schemas/dto/request/create.photo-connection.request";
import { PhotoConnectionResponse } from "../../domain/schemas/dto/response/photo-connection.response";
import { PhotoConnectionModel } from "../../domain/schemas/model/photo-connection.model";

export class PhotoConnectionMapper {
  static fromCreatePhotoConnectionRequestToPhotoConnectionModel(photoConnectionRequest: CreatePhotoConnectionRequest): PhotoConnectionModel {
    const photoConnectionModel = new PhotoConnectionModel(
      photoConnectionRequest.connectionId,
      photoConnectionRequest.photoUrl,
      photoConnectionRequest.description
    );
    return photoConnectionModel;
  }

  static fromPhotoConnectionModelToPhotoConnectionResponse(model: PhotoConnectionModel): PhotoConnectionResponse {
    const response: PhotoConnectionResponse = {
      photoConnectionId: model.getPhotoConnectionId(),
      connectionId: model.getConnectionId(),
      photoUrl: model.getPhotoUrl(),
      description: model.getDescription(),
      createdAt: model.getCreatedAt(),
      updatedAt: model.getUpdatedAt()
    };
    return response;
  }

  static fromPhotoConnectionModelsToPhotoConnectionResponses(models: PhotoConnectionModel[]): PhotoConnectionResponse[] {
    return models.map((model) => this.fromPhotoConnectionModelToPhotoConnectionResponse(model));
  }
}