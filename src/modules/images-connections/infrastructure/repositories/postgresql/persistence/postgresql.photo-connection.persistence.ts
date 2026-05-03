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
export class PhotoConnectionPostgreSQLPersistence implements InterfacePhotoConnectionRepository {
  constructor(private readonly postgreSQLService: DatabaseServicePostgreSQL) {}

  async createPhotoConnection(
    photoConnection: PhotoConnectionModel,
  ): Promise<PhotoConnectionResponse | null> {
    try {
      // Validate connection exists before inserting photo
      const estadoCheck = await this.postgreSQLService.query<any>(
        `SELECT ac.acometida_id, est.nombre AS estado_nombre
         FROM acometida ac
         JOIN cat_estados_acometida est ON ac.estado_id = est.id_estado
         WHERE ac.acometida_id = $1 LIMIT 1`,
        [photoConnection.getConnectionId()],
      );

      if (estadoCheck.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: `Connection ${photoConnection.getConnectionId()} not found.`,
        });
      }

      const query = `
        INSERT INTO foto_acometida (acometida_id, imagen_url, descripcion)
        VALUES ($1, $2, $3)
        RETURNING acometida_id AS "photo_connection_id",
                  imagen_url AS "photo_url",
                  descripcion AS "description",
                  created_at AS "created_at",
                  updated_at AS "updated_at";
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
          foto_acometida_id AS "photo_connection_id",
          acometida_id AS "connection_id",
          imagen_url AS "photo_url",
          descripcion AS "description",
          created_at AS "created_at",
          updated_at AS "updated_at"
        FROM foto_acometida fr
        WHERE fr.acometida_id = $1
        ORDER BY fr.created_at DESC;
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
