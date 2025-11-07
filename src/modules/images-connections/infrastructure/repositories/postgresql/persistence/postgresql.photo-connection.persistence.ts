import { Injectable } from '@nestjs/common';
import { PhotoConnectionSQLResponse } from '../../../interfaces/sql/photo-connection.sql.response';
import { PhotoConnectionAdapter } from '../adapters/photo-connection.adapter';
import { RpcException } from '@nestjs/microservices';
import { InterfacePhotoConnectionRepository } from '../../../../domain/contracts/photo-connection.interface.repository';
import { DatabaseServicePostgreSQL } from '../../../../../../shared/connections/database/postgresql/postgresql.service';
import { PhotoConnectionModel } from '../../../../domain/schemas/model/photo-connection.model';
import { PhotoConnectionResponse } from '../../../../domain/schemas/dto/response/photo-connection.response';
import { statusCode } from '../../../../../../settings/environments/status-code';

@Injectable()
export class PhotoConnectionPostgreSQLPersistence
  implements InterfacePhotoConnectionRepository {
  constructor(private readonly postgreSQLService: DatabaseServicePostgreSQL) { }

  async createPhotoConnection(
    photoConnection: PhotoConnectionModel,
  ): Promise<PhotoConnectionResponse | null> {
    try {
      const query = `
        INSERT INTO fotoacometida (acometidaid, imagenurl, descripcion)
        VALUES ($1, $2, $3)
        RETURNING acometidaid AS "photoConnectionId",
                  imagenurl AS "photoUrl",
                  descripcion AS "description",
                  createdAt AS "createdAt",
                  updatedAt AS "updatedAt";
      `;

      const params = [
        photoConnection.getConnectionId(),
        photoConnection.getPhotoUrl(),
        photoConnection.getDescription() || null,
      ];

      const result =
        await this.postgreSQLService.query<PhotoConnectionSQLResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        return null;
      }

      const createdPhotoConnection: PhotoConnectionResponse =
        PhotoConnectionAdapter.fromPhotoConnectionSQLResponseToPhotoConnectionResponse(
          result[0],
        );

      return createdPhotoConnection;
    } catch (error) {
      throw error;
    }
  }

  async getPhotoConnectionsByCadastralKey(
    cadastralKey: string,
  ): Promise<PhotoConnectionResponse[]> {
    try {
      const query = `
        SELECT 
          fotoacometidaid AS "photoConnectionId",
          acometidaid AS "connectionId",
          imagenurl AS "photoUrl",
          descripcion AS "description",
          createdAt AS "createdAt",
          updatedAt AS "updatedAt"
        FROM fotoacometida fr
        WHERE fr.acometidaid = $1;
      `;

      const params = [cadastralKey];

      const result =
        await this.postgreSQLService.query<PhotoConnectionSQLResponse>(
          query,
          params,
        );

      if (result.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `No photo readings found for cadastral key ${cadastralKey}`,
        });
      }

      const photoConnections: PhotoConnectionResponse[] = result.map(
        (photoConnectionSQL) =>
          PhotoConnectionAdapter.fromPhotoConnectionSQLResponseToPhotoConnectionResponse(
            photoConnectionSQL,
          ),
      );

      return photoConnections;
    } catch (error) {
      throw error;
    }
  }
}
