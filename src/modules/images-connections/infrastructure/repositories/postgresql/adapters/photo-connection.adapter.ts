import { PhotoConnectionResponse } from '../../../../domain/schemas/dto/response/photo-connection.response';
import { PhotoConnectionSQLResponse } from '../../../interfaces/sql/photo-connection.sql.response';

export class PhotoConnectionAdapter {
  static fromPhotoConnectionResponseToSQL(
    photoConnection: PhotoConnectionResponse,
  ): PhotoConnectionSQLResponse {
    return {
      photo_connection_id: photoConnection.photoConnectionId,
      connection_id: photoConnection.connectionId,
      photo_url: photoConnection.photoUrl,
      description: photoConnection.description,
      created_at: photoConnection.createdAt,
      updated_at: photoConnection.updatedAt,
    };
  }

  static fromPhotoConnectionSQLResponseToPhotoConnectionResponse(
    photoConnection: PhotoConnectionSQLResponse,
  ): PhotoConnectionResponse {
    return {
      photoConnectionId: photoConnection.photo_connection_id,
      connectionId: photoConnection.connection_id,
      photoUrl: photoConnection.photo_url,
      description: photoConnection.description,
      createdAt: photoConnection.created_at,
      updatedAt: photoConnection.updated_at,
    };
  }
}
