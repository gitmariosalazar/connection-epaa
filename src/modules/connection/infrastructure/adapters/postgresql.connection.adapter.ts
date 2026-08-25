import {
  ClientResponse,
  CompanyResponse,
  ConnectionAndPropertyResponse,
  ConnectionResponse,
  ConnectionWithoutPropertyResponse,
  ConnectionWithPropertyResponse,
  EmailResponse,
  PhoneResponse,
  PropertyWithClientResponse,
} from '../../domain/schemas/dto/response/connection.response';
import { LiveMapConnectionResponse } from '../../domain/schemas/dto/response/dashboard.response';
import {
  ClientSqlResponse,
  CompanySqlResponse,
  ConnectionAndPropertySqlResponse,
  ConnectionSqlResponse,
  ConnectionWithoutPropertySqlResponse,
  ConnectionWithPropertySqlResponse,
  EmailSqlResponse,
  LiveMapConnectionSqlResponse,
  PhoneSqlResponse,
  PropertyWithClientSqlResponse,
} from '../interfaces/sql/connection.sql.response';

export class ConnectionSqlAdapter {
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
      connectionSewerage:
        connection.connection_sewerage === true ||
        connection.connection_sewerage === 1, // Convert to boolean if it's a number
      connectionStatus: connection.connection_status,
      connectionStateId: connection.connection_state_id,
      connectionIsReadable:
        connection.connection_is_readable === true ||
        connection.connection_is_readable === 1, // Convert to boolean if it's a number
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
      zoneCode: connection.zone_code,
      zoneName: connection.zone_name,
      incidents: connection.incidents, // Total incidents associated with the connection
      connectionType: connection.connection_type,
      connectionTypeName: connection.connection_type_name,
    };
  }

  static fromPropertyWithClientSqlResponseToPropertyWithClientResponse(
    property: PropertyWithClientSqlResponse,
  ): PropertyWithClientResponse {
    return {
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
      company: property.company
        ? this.fromCompanySqlResponseToCompanyResponse(property.company)
        : null,
      person: property.person
        ? this.fromPersonSqlResponseToPersonResponse(property.person)
        : null,
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
      isDeceased: person.is_deceased === true || person.is_deceased === 1, // Convert to boolean if it's a number
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
      connectionMeterNumberCurrent: connection.connection_meter_number_current,
      connectionMeterNumberPreview: connection.connection_meter_number_preview,
      connectionSector: connection.connection_sector,
      connectionAccount: connection.connection_account,
      connectionCadastralKey: connection.connection_cadastral_key,
      connectionContractNumber: connection.connection_contract_number,
      connectionSewerage:
        connection.connection_sewerage === true ||
        connection.connection_sewerage === 1, // Convert to boolean if it's a number
      connectionStatus: connection.connection_status,
      connectionStateId: connection.connection_state_id,
      connectionIsReadable:
        connection.connection_is_readable === true ||
        connection.connection_is_readable === 1, // Convert to boolean if it's a number
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
      incidents: connection.incidents, // Total incidents associated with the connection
      connectionType: connection.connection_type,
      connectionTypeName: connection.connection_type_name,
      // Client Data
      company: connection.company
        ? this.fromCompanySqlResponseToCompanyResponse(connection.company)
        : null,
      person: connection.person
        ? this.fromPersonSqlResponseToPersonResponse(connection.person)
        : null,
      // Property Data
      property: connection.property
        ? {
            propertyId: connection.property.property_id,
            propertySector: connection.property.property_sector,
            propertyTypeId: connection.property.property_type_id,
            propertyAddress: connection.property.property_address,
            propertyAlleyway: connection.property.property_alleyway,
            propertyAltitude: connection.property.property_altitude,
            propertyTypeName: connection.property.property_type_name,
            propertyPrecision: connection.property.property_precision,
            propertyReference: connection.property.property_reference,
            propertyCoordinates: connection.property.property_coordinates,
            propertyCadastralKey: connection.property.property_cadastral_key,
            propertyGeometricZone: connection.property.property_geometric_zone,
          }
        : null,
      lastReadings: connection.last_readings
        ? connection.last_readings.map((reading) => ({
            cadastralKey: reading.cadastral_key,
            readingDate: reading.reading_date,
            readingTime: reading.reading_time,
            readingMonth: reading.reading_month,
            readingValueCurrent: reading.reading_value_current,
            readingValuePreview: reading.reading_value_preview,
            novelty: reading.novelty,
          }))
        : null,
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
      connectionSewerage:
        connection.connection_sewerage === true ||
        connection.connection_sewerage === 1, // Convert to boolean if it's a number
      connectionStatus: connection.connection_status,
      connectionStateId: connection.connection_state_id,
      connectionIsReadable:
        connection.connection_is_readable === true ||
        connection.connection_is_readable === 1, // Convert to boolean if it's a number
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
      connectionType: connection.connection_type,
      connectionTypeName: connection.connection_type_name,
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
      lastReadings: connection.last_readings
        ? connection.last_readings.map((reading) => ({
            cadastralKey: reading.cadastral_key,
            readingDate: reading.reading_date,
            readingTime: reading.reading_time,
            readingMonth: reading.reading_month,
            readingValueCurrent: reading.reading_value_current,
            readingValuePreview: reading.reading_value_preview,
            novelty: reading.novelty,
          }))
        : null,
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
      connectionSewerage:
        connection.connection_sewerage === true ||
        connection.connection_sewerage === 1, // Convert to boolean if it's a number
      connectionStatus: connection.connection_status,
      connectionStateId: connection.connection_state_id,
      connectionIsReadable:
        connection.connection_is_readable === true ||
        connection.connection_is_readable === 1, // Convert to boolean if it's a number
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
      incidents: connection.incidents, // Total incidents associated with the connection
      connectionType: connection.connection_type,
      connectionTypeName: connection.connection_type_name,
      // Client Data
      company: connection.company
        ? this.fromCompanySqlResponseToCompanyResponse(connection.company)
        : null,
      person: connection.person
        ? this.fromPersonSqlResponseToPersonResponse(connection.person)
        : null,
      lastReadings: connection.last_readings
        ? connection.last_readings.map((reading) => ({
            cadastralKey: reading.cadastral_key,
            readingDate: reading.reading_date,
            readingTime: reading.reading_time,
            readingMonth: reading.reading_month,
            readingValueCurrent: reading.reading_value_current,
            readingValuePreview: reading.reading_value_preview,
            novelty: reading.novelty,
          }))
        : null,
      historyMeters: connection.history_meters
        ? connection.history_meters.map((meter) => ({
            cadastralKey: meter.cadastral_key,
            previousMeter: meter.previous_meter,
            newMeter: meter.new_meter,
            installationDate: meter.installation_date,
            uninstallationDate: meter.uninstallation_date,
            status: meter.status,
            observation: meter.observation,
          }))
        : null,
    };
  }

  static toResponse(
    sql: LiveMapConnectionSqlResponse,
  ): LiveMapConnectionResponse {
    return {
      connectionId: sql.connection_id,
      cadastralKey: sql.cadastral_key,
      clientName: sql.client_name,
      address: sql.address,
      sector: Number(sql.sector),
      zoneId: Number(sql.zona_id),
      latitude: Number(sql.latitude),
      longitude: Number(sql.longitude),
      lastUpdated:
        sql.last_updated instanceof Date
          ? sql.last_updated.toISOString()
          : new Date(sql.last_updated).toISOString(),
      statusCategory: sql.status_category,
      markerColor: sql.marker_color,
    };
  }
}
