import { CreateConnectionRequest } from "../../domain/schemas/dto/request/create.connection.request";
import { ConnectionModel } from "../../domain/schemas/models/connection.model";

export class ConnectionMapper {
  static fromCreateConnectionRequestToConnectionModel(connection: CreateConnectionRequest): ConnectionModel {
    const connectionSector: number = connection.connectionId.split('-')[0] ? parseInt(connection.connectionId.split('-')[0]) : 0;
    const connectionAccount: number = connection.connectionId.split('-')[1] ? parseInt(connection.connectionId.split('-')[1]) : 0;
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
    );
  }

  static fromUpdateConnectionRequestToConnectionModel(connection: Partial<CreateConnectionRequest>): ConnectionModel {
    const connectionModel = new ConnectionModel();

    if (connection.connectionId !== undefined) connectionModel.setConnectionId(connection.connectionId);
    if (connection.clientId !== undefined) connectionModel.setClientId(connection.clientId);
    if (connection.connectionRateId !== undefined) connectionModel.setConnectionRateId(connection.connectionRateId);
    if (connection.connectionRateName !== undefined) connectionModel.setConnectionRateName(connection.connectionRateName);
    if (connection.connectionMeterNumber !== undefined) connectionModel.setConnectionMeterNumber(connection.connectionMeterNumber);

    if (connection.connectionId !== undefined) {
      const [sector, account] = connection.connectionId.split('-').map(Number);
      connectionModel.setConnectionSector(sector || 0);
      connectionModel.setConnectionAccount(account || 0);
      connectionModel.setConnectionCadastralKey(connection.connectionId);
    }

    if (connection.connectionContractNumber !== undefined) connectionModel.setConnectionContractNumber(connection.connectionContractNumber);
    if (connection.connectionSewerage !== undefined) connectionModel.setConnectionSewerage(connection.connectionSewerage);
    if (connection.connectionStatus !== undefined) connectionModel.setConnectionStatus(connection.connectionStatus);
    if (connection.connectionAddress !== undefined) connectionModel.setConnectionAddress(connection.connectionAddress);
    if (connection.connectionInstallationDate !== undefined) connectionModel.setConnectionInstallationDate(connection.connectionInstallationDate);
    if (connection.connectionPeopleNumber !== undefined) connectionModel.setConnectionPeopleNumber(connection.connectionPeopleNumber);
    if (connection.connectionZone !== undefined) connectionModel.setConnectionZone(connection.connectionZone);
    if (connection.longitude !== undefined && connection.latitude !== undefined) {
      connectionModel.setConnectionCoordinates(`POINT(${connection.longitude} ${connection.latitude})`);
    }
    if (connection.connectionReference !== undefined) connectionModel.setConnectionReference(connection.connectionReference);
    if (connection.ConnectionMetaData !== undefined) connectionModel.setConnectionMetaData(connection.ConnectionMetaData);
    if (connection.connectionAltitude !== undefined) connectionModel.setConnectionAltitude(connection.connectionAltitude);
    if (connection.connectionPrecision !== undefined) connectionModel.setConnectionPrecision(connection.connectionPrecision);
    if (connection.connectionGeolocationDate !== undefined) connectionModel.setConnectionGeolocationDate(connection.connectionGeolocationDate);
    if (connection.connectionGeometricZone !== undefined) connectionModel.setConnectionGeometricZone(connection.connectionGeometricZone);
    if (connection.propertyCadastralKey !== undefined) connectionModel.setPropertyCadastralKey(connection.propertyCadastralKey);

    return connectionModel;
  }

}