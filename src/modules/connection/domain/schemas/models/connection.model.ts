export class ConnectionModel {
  // --- Propiedades privadas ---
  private connectionId: string;
  private clientId: string;
  private connectionRateId: number;
  private connectionRateName: string;
  private connectionMeterNumber: string;
  private connectionSector: number;
  private connectionAccount: number;
  private connectionCadastralKey: string;
  private connectionContractNumber: string;
  private connectionSewerage: boolean;
  private connectionStatus: boolean;
  private connectionAddress: string;
  private connectionInstallationDate: Date;
  private connectionPeopleNumber: number;
  private connectionZone: number;
  private connectionCoordinates: string;
  private connectionReference: string;
  private connectionMetaData: Record<string, any>;
  private connectionAltitude: number;
  private connectionPrecision: number;
  private connectionGeolocationDate: Date;
  private connectionGeometricZone: string;
  private propertyCadastralKey: string;
  private zoneId: number;

  // ✅ Único constructor (simula vacío o completo)
  constructor(
    connectionId: string = '',
    clientId: string = '',
    connectionRateId: number = 0,
    connectionRateName: string = '',
    connectionMeterNumber: string = '',
    connectionSector: number = 0,
    connectionAccount: number = 0,
    connectionCadastralKey: string = '',
    connectionContractNumber: string = '',
    connectionSewerage: boolean = false,
    connectionStatus: boolean = false,
    connectionAddress: string = '',
    connectionInstallationDate: Date = new Date(),
    connectionPeopleNumber: number = 0,
    connectionZone: number = 0,
    connectionCoordinates: string = '',
    connectionReference: string = '',
    connectionMetaData: Record<string, any> = {},
    connectionAltitude: number = 0,
    connectionPrecision: number = 0,
    connectionGeolocationDate: Date = new Date(),
    connectionGeometricZone: string = '',
    propertyCadastralKey: string = '',
    zoneId: number = 0,
  ) {
    this.connectionId = connectionId;
    this.clientId = clientId;
    this.connectionRateId = connectionRateId;
    this.connectionRateName = connectionRateName;
    this.connectionMeterNumber = connectionMeterNumber;
    this.connectionSector = connectionSector;
    this.connectionAccount = connectionAccount;
    this.connectionCadastralKey = connectionCadastralKey;
    this.connectionContractNumber = connectionContractNumber;
    this.connectionSewerage = connectionSewerage;
    this.connectionStatus = connectionStatus;
    this.connectionAddress = connectionAddress;
    this.connectionInstallationDate = connectionInstallationDate;
    this.connectionPeopleNumber = connectionPeopleNumber;
    this.connectionZone = connectionZone;
    this.connectionCoordinates = connectionCoordinates;
    this.connectionReference = connectionReference;
    this.connectionMetaData = connectionMetaData;
    this.connectionAltitude = connectionAltitude;
    this.connectionPrecision = connectionPrecision;
    this.connectionGeolocationDate = connectionGeolocationDate;
    this.connectionGeometricZone = connectionGeometricZone;
    this.propertyCadastralKey = propertyCadastralKey;
    this.zoneId = zoneId;
  }

  // --- Getters y Setters ---
  public getConnectionId(): string { return this.connectionId; }
  public setConnectionId(value: string): void { this.connectionId = value; }

  public getClientId(): string { return this.clientId; }
  public setClientId(value: string): void { this.clientId = value; }

  public getConnectionRateId(): number { return this.connectionRateId; }
  public setConnectionRateId(value: number): void { this.connectionRateId = value; }

  public getConnectionRateName(): string { return this.connectionRateName; }
  public setConnectionRateName(value: string): void { this.connectionRateName = value; }

  public getConnectionMeterNumber(): string { return this.connectionMeterNumber; }
  public setConnectionMeterNumber(value: string): void { this.connectionMeterNumber = value; }

  public getConnectionSector(): number { return this.connectionSector; }
  public setConnectionSector(value: number): void { this.connectionSector = value; }

  public getConnectionAccount(): number { return this.connectionAccount; }
  public setConnectionAccount(value: number): void { this.connectionAccount = value; }

  public getConnectionCadastralKey(): string { return this.connectionCadastralKey; }
  public setConnectionCadastralKey(value: string): void { this.connectionCadastralKey = value; }

  public getConnectionContractNumber(): string { return this.connectionContractNumber; }
  public setConnectionContractNumber(value: string): void { this.connectionContractNumber = value; }

  public getConnectionSewerage(): boolean { return this.connectionSewerage; }
  public setConnectionSewerage(value: boolean): void { this.connectionSewerage = value; }

  public getConnectionStatus(): boolean { return this.connectionStatus; }
  public setConnectionStatus(value: boolean): void { this.connectionStatus = value; }

  public getConnectionAddress(): string { return this.connectionAddress; }
  public setConnectionAddress(value: string): void { this.connectionAddress = value; }

  public getConnectionInstallationDate(): Date { return this.connectionInstallationDate; }
  public setConnectionInstallationDate(value: Date): void { this.connectionInstallationDate = value; }

  public getConnectionPeopleNumber(): number { return this.connectionPeopleNumber; }
  public setConnectionPeopleNumber(value: number): void { this.connectionPeopleNumber = value; }

  public getConnectionZone(): number { return this.connectionZone; }
  public setConnectionZone(value: number): void { this.connectionZone = value; }

  public getConnectionCoordinates(): string { return this.connectionCoordinates; }
  public setConnectionCoordinates(value: string): void { this.connectionCoordinates = value; }

  public getConnectionReference(): string { return this.connectionReference; }
  public setConnectionReference(value: string): void { this.connectionReference = value; }

  public getConnectionMetaData(): Record<string, any> { return this.connectionMetaData; }
  public setConnectionMetaData(value: Record<string, any>): void { this.connectionMetaData = value; }

  public getConnectionAltitude(): number { return this.connectionAltitude; }
  public setConnectionAltitude(value: number): void { this.connectionAltitude = value; }

  public getConnectionPrecision(): number { return this.connectionPrecision; }
  public setConnectionPrecision(value: number): void { this.connectionPrecision = value; }

  public getConnectionGeolocationDate(): Date { return this.connectionGeolocationDate; }
  public setConnectionGeolocationDate(value: Date): void { this.connectionGeolocationDate = value; }

  public getConnectionGeometricZone(): string { return this.connectionGeometricZone; }
  public setConnectionGeometricZone(value: string): void { this.connectionGeometricZone = value; }

  public getPropertyCadastralKey(): string { return this.propertyCadastralKey; }
  public setPropertyCadastralKey(value: string): void { this.propertyCadastralKey = value; }

  public getZoneId(): number { return this.zoneId; }
  public setZoneId(value: number): void { this.zoneId = value; }

  // --- Conversión a JSON ---
  public toJSON(): Record<string, any> {
    return {
      connectionId: this.connectionId,
      clientId: this.clientId,
      connectionRateId: this.connectionRateId,
      connectionRateName: this.connectionRateName,
      connectionMeterNumber: this.connectionMeterNumber,
      connectionSector: this.connectionSector,
      connectionAccount: this.connectionAccount,
      connectionCadastralKey: this.connectionCadastralKey,
      connectionContractNumber: this.connectionContractNumber,
      connectionSewerage: this.connectionSewerage,
      connectionStatus: this.connectionStatus,
      connectionAddress: this.connectionAddress,
      connectionInstallationDate: this.connectionInstallationDate,
      connectionPeopleNumber: this.connectionPeopleNumber,
      connectionZone: this.connectionZone,
      connectionCoordinates: this.connectionCoordinates,
      connectionReference: this.connectionReference,
      connectionMetaData: this.connectionMetaData,
      connectionAltitude: this.connectionAltitude,
      connectionPrecision: this.connectionPrecision,
      connectionGeolocationDate: this.connectionGeolocationDate,
      connectionGeometricZone: this.connectionGeometricZone,
      propertyCadastralKey: this.propertyCadastralKey,
    };
  }

  // --- Métodos estáticos de ayuda (factories) ---
  public static createEmpty(): ConnectionModel {
    return new ConnectionModel();
  }

  public static fromPartial(data: Partial<ConnectionModel>): ConnectionModel {
    const model = new ConnectionModel();
    Object.assign(model, data);
    return model;
  }
}
