import {
  ClientResponse,
  CompanyResponse,
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
  EmailResponse,
  PhoneResponse,
} from '../../../../domain/schemas/dto/response/connection.response';
import {
  ClientSqlResponse,
  CompanySqlResponse,
  ConnectionAndPropertySqlResponse,
  ConnectionSqlResponse,
  ConnectionWithoutPropertySqlResponse,
  ConnectionWithPropertySqlResponse,
  EmailSqlResponse,
  PhoneSqlResponse,
} from '../../../interfaces/sql/connection.sql.response';

export class ConnectionPostgreSqlAdapter {
  static fromConnectionSqlResponseToConnectionResponse(
    connection: ConnectionSqlResponse,
  ): ConnectionResponse {
    return {
      connectionId: connection.connection_id,
      clientId: connection.client_id,
      connectionRateId: connection.connection_rate_id,
      connectionRateName: connection.connection_rate_name,
      connectionMeterNumber: connection.connection_meter_number,
      connectionSector: connection.connection_sector,
      connectionAccount: connection.connection_account,
      connectionCadastralKey: connection.connection_cadastral_key,
      connectionContractNumber: connection.connection_contract_number,
      connectionSewerage: connection.connection_sewerage,
      connectionStatus: connection.connection_status,
      connectionAddress: connection.connection_address,
      connectionInstallationDate: connection.connection_installation_date,
      connectionPeopleNumber: connection.connection_people_number,
      connectionZone: connection.connection_zone,
      connectionCoordinates: connection.connection_coordinates,
      connectionReference: connection.connection_reference,
      connectionMetaData: connection.connection_metadata,
      connectionAltitude: connection.connection_altitude,
      connectionPrecision: connection.connection_precision,
      connectionGeolocationDate: connection.connection_geolocation_date,
      connectionGeometricZone: connection.connection_geometric_zone,
      propertyCadastralKey: connection.property_cadastral_key,
      zoneId: connection.zone_id,
    };
  }

  static fromPhoneSqlResponseToPhoneResponse(
    phone: PhoneSqlResponse[],
  ): PhoneResponse[] {
    return phone.map((ph) => ({
      telefonoid: ph.telefono_id,
      numero: ph.numero,
    }));
  }

  static fromEmailSqlResponseToEmailResponse(
    email: EmailSqlResponse[],
  ): EmailResponse[] {
    return email.map((em) => ({
      emailid: em.correo_electronico_id,
      email: em.correo,
    }));
  }

  static fromCompanySqlResponseToCompanyResponse(
    company: CompanySqlResponse,
  ): CompanyResponse {
    return {
      ruc: company.ruc,
      address: company.address,
      country: company.country,
      clientId: company.client_id,
      parishId: company.parish_id,
      companyId: company.company_id,
      businessName: company.business_name,
      commercialName: company.commercial_name,
      phones: this.fromPhoneSqlResponseToPhoneResponse(company.phones),
      emails: this.fromEmailSqlResponseToEmailResponse(company.emails),
    };
  }

  static fromPersonSqlResponseToPersonResponse(
    person: ClientSqlResponse,
  ): ClientResponse {
    return {
      address: person.address,
      country: person.country,
      genderId: person.gender_id,
      lastName: person.last_name,
      parishId: person.parish_id,
      personId: person.person_id,
      birthDate: person.birth_date,
      firstName: person.first_name,
      isDeceased: person.is_deceased,
      professionId: person.profession_id,
      civilStatusId: person.civil_status_id,
      phones: this.fromPhoneSqlResponseToPhoneResponse(person.phones),
      emails: this.fromEmailSqlResponseToEmailResponse(person.emails),
    };
  }

  static fromConnectionAndPropertySqlResponseToConnectionAndPropertyResponse(
    connection: ConnectionAndPropertySqlResponse,
  ): ConnectionAndPropertyResponse {
    return {
      // Connection Data
      connectionId: connection.connection_id,
      clientId: connection.client_id,
      connectionRateId: connection.connection_rate_id,
      connectionRateName: connection.connection_rate_name,
      connectionMeterNumber: connection.connection_meter_number,
      connectionSector: connection.connection_sector,
      connectionAccount: connection.connection_account,
      connectionCadastralKey: connection.connection_cadastral_key,
      connectionContractNumber: connection.connection_contract_number,
      connectionSewerage: connection.connection_sewerage,
      connectionStatus: connection.connection_status,
      connectionAddress: connection.connection_address,
      connectionInstallationDate: connection.connection_installation_date,
      connectionPeopleNumbers: connection.connection_people_numbers,
      connectionZone: connection.connection_zone,
      connectionCoordinates: connection.connection_coordinates,
      connectionReference: connection.connection_reference,
      connectionMetadata: connection.connection_metadata,
      connectionAltitude: connection.connection_altitude,
      connectionPrecision: connection.connection_precision,
      connectionGeolocationDate: connection.connection_geolocation_date,
      connectionGeometricZone: connection.connection_geometric_zone,
      propertyCadastralKey: connection.property_cadastral_key,
      zoneId: connection.zone_id,
      zoneCode: connection.zone_code,
      zoneName: connection.zone_name,
      // Client Data
      clientName: connection.client_name,
      clientAddress: connection.client_address,
      phones: connection.phones,
      emails: connection.emails,
      // Property Data
      propertyId: connection.property_id,
      alleyway: connection.alleyway,
      propertySector: connection.property_sector,
      propertyAddress: connection.property_address,
      propertyCoordinates: connection.property_coordinates,
      propertyReference: connection.property_reference,
      propertyAltitude: connection.property_altitude,
      propertyPrecision: connection.property_precision,
      propertyGeometricZone: connection.property_geometric_zone,
      propertyTypeName: connection.property_type_name,
      propertyTypeId: connection.property_type_id,
    };
  }

  static fromConnectionWithPropertySqlResponseToConnectionWithPropertyResponse(
    connection: ConnectionWithPropertySqlResponse,
  ): ConnectionWithPropertyResponse {
    return {
      // Connection Data
      connectionId: connection.connection_id,
      clientId: connection.client_id,
      connectionRateId: connection.connection_rate_id,
      connectionRateName: connection.connection_rate_name,
      connectionMeterNumber: connection.connection_meter_number,
      connectionSector: connection.connection_sector,
      connectionAccount: connection.connection_account,
      connectionCadastralKey: connection.connection_cadastral_key,
      connectionContractNumber: connection.connection_contract_number,
      connectionSewerage: connection.connection_sewerage,
      connectionStatus: connection.connection_status,
      connectionAddress: connection.connection_address,
      connectionInstallationDate: connection.connection_installation_date,
      connectionPeopleNumber: connection.connection_people_number,
      connectionZone: connection.connection_zone,
      connectionCoordinates: connection.connection_coordinates,
      connectionReference: connection.connection_reference,
      connectionMetadata: connection.connection_metadata,
      connectionAltitude: connection.connection_altitude,
      connectionPrecision: connection.connection_precision,
      connectionGeolocationDate: connection.connection_geolocation_date,
      connectionGeometricZone: connection.connection_geometric_zone,
      propertyCadastralKey: connection.property_cadastral_key,
      zoneId: connection.zone_id,
      zoneCode: connection.zone_code,
      zoneName: connection.zone_name,
      // Client Data
      company: connection.company
        ? this.fromCompanySqlResponseToCompanyResponse(connection.company)
        : null,
      person: connection.person
        ? this.fromPersonSqlResponseToPersonResponse(connection.person)
        : null,
      // Property Data
      properties: connection.properties
        ? connection.properties.map((property) => ({
            propertyId: property.property_id,
            propertySector: property.property_sector,
            propertyTypeId: property.property_type_id,
            propertyAddress: property.property_address,
            propertyAlleyway: property.property_alleyway,
            propertyAltitude: property.property_altitude,
            propertyTypeName: property.property_type_name,
            propertyPrecision: property.property_precision,
            propertyReference: property.property_reference,
            propertyCoordinates: property.property_coordinates,
            propertyCadastralKey: property.property_cadastral_key,
            propertyGeometricZone: property.property_geometric_zone,
          }))
        : [],
    };
  }

  static fromConnectionWithoutPropertySqlResponseToConnectionWithoutPropertyResponse(
    connection: ConnectionWithoutPropertySqlResponse,
  ): ConnectionWithoutPropertyResponse {
    return {
      // Connection Data
      connectionId: connection.connection_id,
      clientId: connection.client_id,
      connectionRateId: connection.connection_rate_id,
      connectionRateName: connection.connection_rate_name,
      connectionMeterNumber: connection.connection_meter_number,
      connectionSector: connection.connection_sector,
      connectionAccount: connection.connection_account,
      connectionCadastralKey: connection.connection_cadastral_key,
      connectionContractNumber: connection.connection_contract_number,
      connectionSewerage: connection.connection_sewerage,
      connectionStatus: connection.connection_status,
      connectionAddress: connection.connection_address,
      connectionInstallationDate: connection.connection_installation_date,
      connectionPeopleNumber: connection.connection_people_number,
      connectionZone: connection.connection_zone,
      connectionCoordinates: connection.connection_coordinates,
      connectionReference: connection.connection_reference,
      connectionMetadata: connection.connection_metadata,
      connectionAltitude: connection.connection_altitude,
      connectionPrecision: connection.connection_precision,
      connectionGeolocationDate: connection.connection_geolocation_date,
      connectionGeometricZone: connection.connection_geometric_zone,
      propertyCadastralKey: connection.property_cadastral_key,
      zoneId: connection.zone_id,
      zoneCode: connection.zone_code,
      zoneName: connection.zone_name,
      // Client Data
      company: connection.company
        ? this.fromCompanySqlResponseToCompanyResponse(connection.company)
        : null,
      person: connection.person
        ? this.fromPersonSqlResponseToPersonResponse(connection.person)
        : null,
    };
  }
}
