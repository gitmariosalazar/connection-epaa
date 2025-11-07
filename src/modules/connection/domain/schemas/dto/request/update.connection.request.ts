export class UpdateConnectionRequest {
  connectionId: string;
  clientId: string;
  connectionRateId: number;
  connectionRateName: string;
  connectionMeterNumber: string;
  connectionSector: number;
  connectionAccount: number;
  connectionCadastralKey: string;
  connectionContractNumber: string;
  connectionSewerage: boolean;
  connectionStatus: boolean;
  connectionAddress: string;
  connectionInstallationDate: Date;
  connectionPeopleNumber: number;
  connectionZone: number;
  longitude: number;
  latitude: number;
  connectionReference: string;
  ConnectionMetaData: { [key: string]: any };
  connectionAltitude: number;
  connectionPrecision: number;
  connectionGeolocationDate: Date;
  connectionGeometricZone: string;
  propertyCadastralKey: string;
  zoneId: number;

  constructor(
    connectionId: string,
    clientId: string,
    connectionRateId: number,
    connectionRateName: string,
    connectionMeterNumber: string,
    //connectionSector: number,
    //connectionAccount: number,
    //connectionCadastralKey: string,
    connectionContractNumber: string,
    connectionSewerage: boolean,
    connectionStatus: boolean,
    connectionAddress: string,
    connectionInstallationDate: Date,
    connectionPeopleNumber: number,
    connectionZone: number,
    longitude: number,
    latitude: number,
    connectionReference: string,
    ConnectionMetaData: { [key: string]: any },
    connectionAltitude: number,
    connectionPrecision: number,
    connectionGeolocationDate: Date,
    connectionGeometricZone: string,
    propertyCadastralKey: string,
    zoneId: number,
  ) {
    this.connectionId = connectionId;
    this.clientId = clientId;
    this.connectionRateId = connectionRateId;
    this.connectionRateName = connectionRateName;
    this.connectionMeterNumber = connectionMeterNumber;
    //this.connectionSector = connectionSector;
    //this.connectionAccount = connectionAccount;
    //this.connectionCadastralKey = connectionCadastralKey;
    this.connectionContractNumber = connectionContractNumber;
    this.connectionSewerage = connectionSewerage;
    this.connectionStatus = connectionStatus;
    this.connectionAddress = connectionAddress;
    this.connectionInstallationDate = connectionInstallationDate;
    this.connectionPeopleNumber = connectionPeopleNumber;
    this.connectionZone = connectionZone;
    this.longitude = longitude;
    this.latitude = latitude;
    this.connectionReference = connectionReference;
    this.ConnectionMetaData = ConnectionMetaData;
    this.connectionAltitude = connectionAltitude;
    this.connectionPrecision = connectionPrecision;
    this.connectionGeolocationDate = connectionGeolocationDate;
    this.connectionGeometricZone = connectionGeometricZone;
    this.propertyCadastralKey = propertyCadastralKey;
    this.zoneId = zoneId;
  }
}