import {
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
} from '../../../../domain/schemas/dto/response/connection.response';
import {
  ConnectionAndPropertySqlResponse,
  ConnectionSqlResponse,
  ConnectionWithoutPropertySqlResponse,
  ConnectionWithPropertySqlResponse,
} from '../../../interfaces/sql/connection.sql.response';

export class ConnectionPostgreSqlAdapter {
  static fromConnectionSqlResponseToConnectionResponse(
    connection: ConnectionSqlResponse,
  ): ConnectionResponse {
    return {
      connectionId: connection.connectionId,
      clientId: connection.clientId,
      connectionRateId: connection.connectionRateId,
      connectionRateName: connection.connectionRateName,
      connectionMeterNumber: connection.connectionMeterNumber,
      connectionSector: connection.connectionSector,
      connectionAccount: connection.connectionAccount,
      connectionCadastralKey: connection.connectionCadastralKey,
      connectionContractNumber: connection.connectionContractNumber,
      connectionSewerage: connection.connectionSewerage,
      connectionStatus: connection.connectionStatus,
      connectionAddress: connection.connectionAddress,
      connectionInstallationDate: connection.connectionInstallationDate,
      connectionPeopleNumber: connection.connectionPeopleNumber,
      connectionZone: connection.connectionZone,
      connectionCoordinates: connection.connectionCoordinates,
      connectionReference: connection.connectionReference,
      ConnectionMetaData: connection.ConnectionMetaData,
      connectionAltitude: connection.connectionAltitude,
      connectionPrecision: connection.connectionPrecision,
      connectionGeolocationDate: connection.connectionGeolocationDate,
      connectionGeometricZone: connection.connectionGeometricZone,
      propertyCadastralKey: connection.propertyCadastralKey,
      zoneId: connection.zoneId,
    };
  }

  static fromConnectionAndPropertySqlResponseToConnectionAndPropertyResponse(
    connection: ConnectionAndPropertySqlResponse,
  ): ConnectionAndPropertyResponse {
    return {
      // Connection Data
      connectionId: connection.connectionId,
      clientId: connection.clientId,
      connectionRateId: connection.connectionRateId,
      connectionRateName: connection.connectionRateName,
      connectionMeterNumber: connection.connectionMeterNumber,
      connectionSector: connection.connectionSector,
      connectionAccount: connection.connectionAccount,
      connectionCadastralKey: connection.connectionCadastralKey,
      connectionContractNumber: connection.connectionContractNumber,
      connectionSewerage: connection.connectionSewerage,
      connectionStatus: connection.connectionStatus,
      connectionAddress: connection.connectionAddress,
      connectionInstallationDate: connection.connectionInstallationDate,
      connectionPeopleNumbers: connection.connectionPeopleNumbers,
      connectionZone: connection.connectionZone,
      connectionCoordinates: connection.connectionCoordinates,
      connectionReference: connection.connectionReference,
      connectionMetadata: connection.connectionMetadata,
      connectionAltitude: connection.connectionAltitude,
      connectionPrecision: connection.connectionPrecision,
      connectionGeolocationDate: connection.connectionGeolocationDate,
      connectionGeometricZone: connection.connectionGeometricZone,
      propertyCadastralKey: connection.propertyCadastralKey,
      zoneId: connection.zoneId,
      zoneCode: connection.zoneCode,
      zoneName: connection.zoneName,
      // Client Data
      clientName: connection.clientName,
      clientAddress: connection.clientAddress,
      phones: connection.phones,
      emails: connection.emails,
      // Property Data
      propertyId: connection.propertyId,
      alleyway: connection.alleyway,
      propertySector: connection.propertySector,
      propertyAddress: connection.propertyAddress,
      propertyCoordinates: connection.propertyCoordinates,
      propertyReference: connection.propertyReference,
      propertyAltitude: connection.propertyAltitude,
      propertyPrecision: connection.propertyPrecision,
      propertyGeometricZone: connection.propertyGeometricZone,
      propertyTypeName: connection.propertyTypeName,
      propertyTypeId: connection.propertyTypeId,
    };
  }

  static fromConnectionWithPropertySqlResponseToConnectionWithPropertyResponse(
    connection: ConnectionWithPropertySqlResponse,
  ): ConnectionWithPropertyResponse {
    return {
      // Connection Data
      connectionId: connection.connectionId,
      clientId: connection.clientId,
      connectionRateId: connection.connectionRateId,
      connectionRateName: connection.connectionRateName,
      connectionMeterNumber: connection.connectionMeterNumber,
      connectionSector: connection.connectionSector,
      connectionAccount: connection.connectionAccount,
      connectionCadastralKey: connection.connectionCadastralKey,
      connectionContractNumber: connection.connectionContractNumber,
      connectionSewerage: connection.connectionSewerage,
      connectionStatus: connection.connectionStatus,
      connectionAddress: connection.connectionAddress,
      connectionInstallationDate: connection.connectionInstallationDate,
      connectionPeopleNumber: connection.connectionPeopleNumber,
      connectionZone: connection.connectionZone,
      connectionCoordinates: connection.connectionCoordinates,
      connectionReference: connection.connectionReference,
      connectionMetadata: connection.connectionMetadata,
      connectionAltitude: connection.connectionAltitude,
      connectionPrecision: connection.connectionPrecision,
      connectionGeolocationDate: connection.connectionGeolocationDate,
      connectionGeometricZone: connection.connectionGeometricZone,
      propertyCadastralKey: connection.propertyCadastralKey,
      zoneId: connection.zoneId,
      zoneCode: connection.zoneCode,
      zoneName: connection.zoneName,
      // Client Data
      company: connection.company,
      person: connection.person,
      // Property Data
      properties: connection.properties,
    };
  }

  static fromConnectionWithoutPropertySqlResponseToConnectionWithoutPropertyResponse(
    connection: ConnectionWithoutPropertySqlResponse,
  ): ConnectionWithoutPropertyResponse {
    return {
      // Connection Data
      connectionId: connection.connectionId,
      clientId: connection.clientId,
      connectionRateId: connection.connectionRateId,
      connectionRateName: connection.connectionRateName,
      connectionMeterNumber: connection.connectionMeterNumber,
      connectionSector: connection.connectionSector,
      connectionAccount: connection.connectionAccount,
      connectionCadastralKey: connection.connectionCadastralKey,
      connectionContractNumber: connection.connectionContractNumber,
      connectionSewerage: connection.connectionSewerage,
      connectionStatus: connection.connectionStatus,
      connectionAddress: connection.connectionAddress,
      connectionInstallationDate: connection.connectionInstallationDate,
      connectionPeopleNumber: connection.connectionPeopleNumber,
      connectionZone: connection.connectionZone,
      connectionCoordinates: connection.connectionCoordinates,
      connectionReference: connection.connectionReference,
      connectionMetadata: connection.connectionMetadata,
      connectionAltitude: connection.connectionAltitude,
      connectionPrecision: connection.connectionPrecision,
      connectionGeolocationDate: connection.connectionGeolocationDate,
      connectionGeometricZone: connection.connectionGeometricZone,
      propertyCadastralKey: connection.propertyCadastralKey,
      zoneId: connection.zoneId,
      zoneCode: connection.zoneCode,
      zoneName: connection.zoneName,
      // Client Data
      company: connection.company,
      person: connection.person,
    };
  }
}
