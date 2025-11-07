import { PhotoConnectionResponse } from "../../../../domain/schemas/dto/response/photo-connection.response";
import { PhotoConnectionSQLResponse } from "../../../interfaces/sql/photo-connection.sql.response";

export class PhotoConnectionAdapter {
  static fromPhotoConnectionResponseToSQL(photoConnection: PhotoConnectionResponse): PhotoConnectionSQLResponse {
    return {
      photoConnectionId: photoConnection.photoConnectionId,
      connectionId: photoConnection.connectionId,
      photoUrl: photoConnection.photoUrl,
      description: photoConnection.description,
      createdAt: photoConnection.createdAt,
      updatedAt: photoConnection.updatedAt,
    };
  }

  static fromPhotoConnectionSQLResponseToPhotoConnectionResponse(photoConnection: PhotoConnectionSQLResponse): PhotoConnectionResponse {
    return {
      photoConnectionId: photoConnection.photoConnectionId,
      connectionId: photoConnection.connectionId,
      photoUrl: photoConnection.photoUrl,
      description: photoConnection.description,
      createdAt: photoConnection.createdAt,
      updatedAt: photoConnection.updatedAt,
    };
  }
}