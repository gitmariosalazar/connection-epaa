import { UUID } from 'crypto';

export class ConnectionSqlResponse {
  connection_id: string;
  client_id: string;
  connection_rate_id: number;
  connection_rate_name: string;
  connection_meter_number: string;
  connection_sector: number;
  connection_account: number;
  connection_cadastral_key: string;
  connection_contract_number: string;
  connection_sewerage: boolean;
  connection_status: boolean;
  connection_address: string;
  connection_installation_date: Date;
  connection_people_number: number;
  connection_zone: number;
  connection_coordinates: string;
  connection_reference: string;
  connection_metadata: Record<string, any>;
  connection_altitude: number;
  connection_precision: number;
  connection_geolocation_date: Date;
  connection_geometric_zone: string;
  property_cadastral_key: string;
  zone_id: number;
}

export interface ConnectionAndPropertySqlResponse {
  // Connection Data
  connection_id: string;
  client_id: string;
  connection_rate_id: string;
  connection_rate_name: string;
  connection_meter_number: string | null;
  connection_sector: string | null;
  connection_account: string | null;
  connection_cadastral_key: string | null;
  connection_contract_number: string | null;
  connection_sewerage: boolean | null;
  connection_status: string | null;
  connection_address: string | null;
  connection_installation_date: string | Date | null;
  connection_people_numbers: number | null;
  connection_zone: string | null;
  connection_coordinates: string | null;
  connection_reference: string | null;
  connection_metadata: Record<string, any> | null;
  connection_altitude: number | null;
  connection_precision: number | null;
  connection_geolocation_date: string | Date | null;
  connection_geometric_zone: string | null;
  property_cadastral_key: string | null;
  zone_id: number;
  zone_code: string;
  zone_name: string;
  // Client Data
  client_name: string;
  client_address: string | null;
  phones: string[] | null;
  emails: string[] | null;
  // Property Data
  property_id: UUID | null;
  alleyway: string | null;
  property_sector: string | null;
  property_address: string | null;
  property_coordinates: string | null; // o { lat: number; lng: number }
  property_reference: string | null;
  property_altitude: number | null;
  property_precision: number | null;
  property_geometric_zone: string | null;
  property_type_name: string | null;
  property_type_id: string | null;
}

export interface PropertyResponse {
  property_id: UUID;
  property_sector: string | null;
  property_type_id: number | null;
  property_address: string | null;
  property_alleyway: string | null;
  property_altitude: number | null;
  property_type_name: string | null;
  property_precision: number | null;
  property_reference: string | null;
  property_coordinates: string | null;
  property_cadastral_key: string | null;
  property_geometric_zone: string | null;
}

export interface ConnectionWithPropertySqlResponse {
  // Connection Data
  connection_id: string;
  client_id: string;
  connection_rate_id: string;
  connection_rate_name: string;
  connection_meter_number: string | null;
  connection_sector: string | null;
  connection_account: string | null;
  connection_cadastral_key: string | null;
  connection_contract_number: string | null;
  connection_sewerage: boolean | null;
  connection_status: string | null;
  connection_address: string | null;
  connection_installation_date: string | Date | null;
  connection_people_number: number | null;
  connection_zone: string | null;
  connection_coordinates: string | null;
  connection_reference: string | null;
  connection_metadata: Record<string, any> | null;
  connection_altitude: number | null;
  connection_precision: number | null;
  connection_geolocation_date: string | Date | null;
  connection_geometric_zone: string | null;
  property_cadastral_key: string | null;
  zone_id: number;
  zone_code: string;
  zone_name: string;
  // Client Data
  company: CompanySqlResponse | null;
  person: ClientSqlResponse | null;
  // Property Data
  properties: PropertyResponse[];
}

export interface ConnectionWithoutPropertySqlResponse {
  // Connection Data
  connection_id: string;
  client_id: string;
  connection_rate_id: string;
  connection_rate_name: string;
  connection_meter_number: string | null;
  connection_sector: string | null;
  connection_account: string | null;
  connection_cadastral_key: string | null;
  connection_contract_number: string | null;
  connection_sewerage: boolean | null;
  connection_status: string | null;
  connection_address: string | null;
  connection_installation_date: string | Date | null;
  connection_people_number: number | null;
  connection_zone: string | null;
  connection_coordinates: string | null;
  connection_reference: string | null;
  connection_metadata: Record<string, any> | null;
  connection_altitude: number | null;
  connection_precision: number | null;
  connection_geolocation_date: string | Date | null;
  connection_geometric_zone: string | null;
  property_cadastral_key: string | null;
  zone_id: number;
  zone_code: string;
  zone_name: string;
  // Client Data
  company: CompanySqlResponse | null;
  person: ClientSqlResponse | null;
}

export interface ClientSqlResponse {
  address: string;
  country: string;
  gender_id: number;
  last_name: string;
  parish_id: string;
  person_id: string;
  birth_date: string;
  first_name: string;
  is_deceased: boolean;
  profession_id: number;
  civil_status_id: number;
  phones: PhoneSqlResponse[];
  emails: EmailSqlResponse[];
}

export interface CompanySqlResponse {
  ruc: string;
  address: string;
  country: string;
  client_id: string;
  parish_id: string;
  company_id: number;
  business_name: string;
  commercial_name: string;
  phones: PhoneSqlResponse[];
  emails: EmailSqlResponse[];
}

export interface PhoneSqlResponse {
  telefono_id: number;
  numero: string;
}

export interface EmailSqlResponse {
  correo_electronico_id: number;
  correo: string;
}
