import { CreateConnectionRequest } from '../../domain/schemas/dto/request/create.connection.request';
import { ConnectionResponse } from '../../domain/schemas/dto/response/connection.response';
import { ConnectionModel } from '../../domain/schemas/models/connection.model';

export class ConnectionMapper {
  static fromCreateConnectionRequestToConnectionModel(
    connection: CreateConnectionRequest,
  ): ConnectionModel {
    const connectionSector: number = connection.connectionId.split('-')[0]
      ? parseInt(connection.connectionId.split('-')[0])
      : 0;
    const connectionAccount: number = connection.connectionId.split('-')[1]
      ? parseInt(connection.connectionId.split('-')[1])
      : 0;
    const connectionCadastralKey: string = connection.connectionId;
    return new ConnectionModel(
      connection.connectionId,
      connection.clientId,
      connection.connectionRateId,
      connection.connectionRateName,
      connection.connectionMeterNumber,
      connectionSector,
      connectionAccount,
      connectionCadastralKey,
      connection.connectionContractNumber,
      connection.connectionSewerage,
      connection.connectionStatus,
      connection.connectionAddress,
      connection.connectionInstallationDate,
      connection.connectionPeopleNumber,
      connection.connectionZone,
      `POINT(${connection.longitude} ${connection.latitude})`,
      connection.connectionReference,
      connection.ConnectionMetaData,
      connection.connectionAltitude,
      connection.connectionPrecision,
      connection.connectionGeolocationDate,
      connection.connectionGeometricZone,
      connection.propertyCadastralKey,
      connection.zoneId,
    );
  }

  static fromUpdateConnectionRequestToConnectionModel(
    connection: Partial<CreateConnectionRequest>,
    existingConnection: ConnectionModel,
  ): ConnectionModel {
    const connectionModel = new ConnectionModel(
      connection.connectionId || existingConnection['connectionId'],
      connection.clientId || existingConnection['clientId'],
      connection.connectionRateId || existingConnection['connectionRateId'],
      connection.connectionRateName || existingConnection['connectionRateName'],
      connection.connectionMeterNumber ||
        existingConnection['connectionMeterNumber'],
      connection.connectionId
        ? parseInt(connection.connectionId.split('-')[0])
        : existingConnection['connectionSector'],
      connection.connectionId
        ? parseInt(connection.connectionId.split('-')[1])
        : existingConnection['connectionAccount'],
      connection.connectionId || existingConnection['connectionCadastralKey'],
      connection.connectionContractNumber ||
        existingConnection['connectionContractNumber'],
      connection.connectionSewerage !== undefined
        ? connection.connectionSewerage
        : existingConnection['connectionSewerage'],
      connection.connectionStatus !== undefined
        ? connection.connectionStatus
        : existingConnection['connectionStatus'],
      connection.connectionAddress || existingConnection['connectionAddress'],
      connection.connectionInstallationDate ||
        existingConnection['connectionInstallationDate'],
      connection.connectionPeopleNumber ||
        existingConnection['connectionPeopleNumber'],
      connection.connectionZone || existingConnection['connectionZone'],
      `POINT(${connection.longitude || existingConnection['longitude']} ${connection.latitude || existingConnection['latitude']})`,
      connection.connectionReference ||
        existingConnection['connectionReference'],
      connection.ConnectionMetaData || existingConnection['connectionMetaData'],
      connection.connectionAltitude || existingConnection['connectionAltitude'],
      connection.connectionPrecision ||
        existingConnection['connectionPrecision'],
      connection.connectionGeolocationDate ||
        existingConnection['connectionGeolocationDate'],
      connection.connectionGeometricZone ||
        existingConnection['connectionGeometricZone'],
      connection.propertyCadastralKey ||
        existingConnection['propertyCadastralKey'],
      connection.zoneId || existingConnection['zoneId'],
    );
    return connectionModel;
  }

  static fromResponseToModel(response: ConnectionResponse): ConnectionModel {
    return new ConnectionModel(
      response.connectionId,
      response.clientId,
      response.connectionRateId,
      response.connectionRateName,
      response.connectionMeterNumber,
      response.connectionSector,
      response.connectionAccount,
      response.connectionCadastralKey,
      response.connectionContractNumber,
      response.connectionSewerage,
      response.connectionStatus,
      response.connectionAddress,
      response.connectionInstallationDate,
      response.connectionPeopleNumber,
      response.connectionZone,
      response.connectionCoordinates,
      response.connectionReference,
      response.connectionMetaData,
      response.connectionAltitude,
      response.connectionPrecision,
      response.connectionGeolocationDate,
      response.connectionGeometricZone,
      response.propertyCadastralKey,
      response.zoneId,
    );
  }
}
