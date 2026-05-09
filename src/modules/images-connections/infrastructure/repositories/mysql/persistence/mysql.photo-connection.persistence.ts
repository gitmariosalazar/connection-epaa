import { Injectable } from '@nestjs/common';
import { PhotoConnectionSQLResponse } from '../../../interfaces/sql/photo-connection.sql.response';
import { RpcException } from '@nestjs/microservices';
import { InterfacePhotoConnectionRepository } from '../../../../domain/contracts/photo-connection.interface.repository';
import { DatabaseServicePostgreSQL } from '../../../../../../shared/connections/database/postgresql/postgresql.service';
import { PhotoConnectionModel } from '../../../../domain/schemas/model/photo-connection.model';
import { PhotoConnectionResponse } from '../../../../domain/schemas/dto/response/photo-connection.response';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { PhotoConnectionAdapter } from '../../../adapters/photo-connection.adapter';
import { DatabaseServiceMySQL } from '../../../../../../shared/connections/database/mysql/mysql.service';

@Injectable()
export class PhotoConnectionMySQLPersistence
  implements InterfacePhotoConnectionRepository
{
  constructor(private readonly mySQLService: DatabaseServiceMySQL) {}

  async createPhotoConnection(
    photoConnection: PhotoConnectionModel,
  ): Promise<PhotoConnectionResponse | null> {
    try {
      // Validate connection exists before inserting photo
      const estadoCheck = await this.mySQLService.query<any>(
        `SELECT ac.acometida_id, est.nombre AS estado_nombre
         FROM acometida ac
         JOIN cat_estados_acometida est ON ac.estado_id = est.id_estado
         WHERE ac.acometida_id = ? LIMIT 1`,
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
        VALUES (?, ?, ?);
      `;

      const params = [
        photoConnection.getConnectionId(),
        photoConnection.getPhotoUrl(),
        photoConnection.getDescription() || null,
      ];

      const result: any = await this.mySQLService.query(
        query,
        params,
      );

      if (result.affectedRows === 0) {
        return null;
      }
      
      const selectQuery = `
        SELECT 
          foto_acometida_id AS "photo_connection_id",
          acometida_id AS "connection_id",
          imagen_url AS "photo_url",
          descripcion AS "description",
          created_at AS "created_at",
          updated_at AS "updated_at"
        FROM foto_acometida
        WHERE foto_acometida_id = ?;
      `;
      const selectResult = await this.mySQLService.query<PhotoConnectionSQLResponse>(selectQuery, [result.insertId]);

      const createdPhotoConnection: PhotoConnectionResponse =
        PhotoConnectionAdapter.fromPhotoConnectionSQLResponseToPhotoConnectionResponse(
          selectResult[0],
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
        WHERE fr.acometida_id = ?
        ORDER BY fr.created_at DESC;
      `;

      const params = [cadastralKey];

      const result = await this.mySQLService.query<PhotoConnectionSQLResponse>(
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
