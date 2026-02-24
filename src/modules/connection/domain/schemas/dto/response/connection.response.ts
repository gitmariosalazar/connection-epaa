import { UUID } from 'crypto';

export interface ConnectionResponse {
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
  connectionCoordinates: string;
  connectionReference: string;
  connectionMetaData: Record<string, any>;
  connectionAltitude: number;
  connectionPrecision: number;
  connectionGeolocationDate: Date;
  connectionGeometricZone: string;
  propertyCadastralKey: string;
  zoneId: number;
}

export interface ConnectionAndPropertyResponse {
  // Connection Data
  connectionId: string;
  clientId: string;
  connectionRateId: string;
  connectionRateName: string;
  connectionMeterNumber: string | null;
  connectionSector: string | null;
  connectionAccount: string | null;
  connectionCadastralKey: string | null;
  connectionContractNumber: string | null;
  connectionSewerage: boolean | null;
  connectionStatus: string | null;
  connectionAddress: string | null;
  connectionInstallationDate: string | Date | null;
  connectionPeopleNumbers: number | null;
  connectionZone: string | null;
  connectionCoordinates: string | null;
  connectionReference: string | null;
  connectionMetadata: Record<string, any> | null;
  connectionAltitude: number | null;
  connectionPrecision: number | null;
  connectionGeolocationDate: string | Date | null;
  connectionGeometricZone: string | null;
  propertyCadastralKey: string | null;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  // Client Data
  clientName: string;
  clientAddress: string | null;
  phones: string[] | null;
  emails: string[] | null;
  // Property Data
  propertyId: UUID | null;
  alleyway: string | null;
  propertySector: string | null;
  propertyAddress: string | null;
  propertyCoordinates: string | null; // o { lat: number; lng: number }
  propertyReference: string | null;
  propertyAltitude: number | null;
  propertyPrecision: number | null;
  propertyGeometricZone: string | null;
  propertyTypeName: string | null;
  propertyTypeId: string | null;
}

export interface PropertyResponse {
  propertyId: UUID;
  propertySector: string | null;
  propertyTypeId: number | null;
  propertyAddress: string | null;
  propertyAlleyway: string | null;
  propertyAltitude: number | null;
  propertyTypeName: string | null;
  propertyPrecision: number | null;
  propertyReference: string | null;
  propertyCoordinates: string | null;
  propertyCadastralKey: string | null;
  propertyGeometricZone: string | null;
}

export interface ConnectionWithPropertyResponse {
  // Connection Data
  connectionId: string;
  clientId: string;
  connectionRateId: string;
  connectionRateName: string;
  connectionMeterNumber: string | null;
  connectionSector: string | null;
  connectionAccount: string | null;
  connectionCadastralKey: string | null;
  connectionContractNumber: string | null;
  connectionSewerage: boolean | null;
  connectionStatus: string | null;
  connectionAddress: string | null;
  connectionInstallationDate: string | Date | null;
  connectionPeopleNumber: number | null;
  connectionZone: string | null;
  connectionCoordinates: string | null;
  connectionReference: string | null;
  connectionMetadata: Record<string, any> | null;
  connectionAltitude: number | null;
  connectionPrecision: number | null;
  connectionGeolocationDate: string | Date | null;
  connectionGeometricZone: string | null;
  propertyCadastralKey: string | null;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  // Client Data
  company: CompanyResponse | null;
  person: ClientResponse | null;
  // Property Data
  properties: PropertyResponse[];
}

export interface ConnectionWithoutPropertyResponse {
  // Connection Data
  connectionId: string;
  clientId: string;
  connectionRateId: string;
  connectionRateName: string;
  connectionMeterNumber: string | null;
  connectionSector: string | null;
  connectionAccount: string | null;
  connectionCadastralKey: string | null;
  connectionContractNumber: string | null;
  connectionSewerage: boolean | null;
  connectionStatus: string | null;
  connectionAddress: string | null;
  connectionInstallationDate: string | Date | null;
  connectionPeopleNumber: number | null;
  connectionZone: string | null;
  connectionCoordinates: string | null;
  connectionReference: string | null;
  connectionMetadata: Record<string, any> | null;
  connectionAltitude: number | null;
  connectionPrecision: number | null;
  connectionGeolocationDate: string | Date | null;
  connectionGeometricZone: string | null;
  propertyCadastralKey: string | null;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  // Client Data
  company: CompanyResponse | null;
  person: ClientResponse | null;
}

export interface ClientResponse {
  address: string;
  country: string;
  genderId: number;
  lastName: string;
  parishId: string;
  personId: string;
  birthDate: string;
  firstName: string;
  isDeceased: boolean;
  professionId: number;
  civilStatusId: number;
  phones: PhoneResponse[];
  emails: EmailResponse[];
}

export interface CompanyResponse {
  ruc: string;
  address: string;
  country: string;
  clientId: string;
  parishId: string;
  companyId: number;
  businessName: string;
  commercialName: string;
  phones: PhoneResponse[];
  emails: EmailResponse[];
}

export interface PhoneResponse {
  telefonoid: number;
  numero: string;
}

export interface EmailResponse {
  emailid: number;
  email: string;
}
