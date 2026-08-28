import { UUID } from 'crypto';

export interface PreviousMeterDetail {
  numero_medidor?: string;
  ultima_lectura?: number;
  fecha_ultima_lectura?: string; // ISO 8601 Date string
}

export interface NewMeterDetail {
  numero_medidor: string;
  lectura_anterior?: number;
  lectura_actual?: number;
  fecha_ultima_lectura?: string; // ISO 8601 Date string
}

// Misma forma que IncidentChangeDetail (microservicio readings) para que
// detalles_cambio se guarde con una estructura uniforme en todo el sistema.
export interface MeterChangeDetail {
  clave_catastral?: string;
  numero_medidor?: string;
  serie?: string;
  ubicacion?: string;
  observaciones?: string;
  medidor_anterior?: PreviousMeterDetail;
  medidor_nuevo: NewMeterDetail;
  user_id?: UUID; // ID del usuario que realiza el cambio, si aplica
}

export interface MeterChangePhotoInput {
  // Uno de los dos: base64 recién subido, o una URL/metadata ya existente
  fileBase64?: string;
  fileUrl?: string;
  originalName: string;
  mimeType?: string;
  sizeInBytes?: number;
  hashSha256?: string;
  description?: string | null;
}

// Foto ya almacenada en disco (URL resuelta), lista para persistir en foto_cambio_medidor
export interface UploadedMeterChangePhoto {
  fileUrl: string;
  description?: string | null;
}

export class ChangeMeterRequest {
  connectionId!: string;
  changeDetail!: MeterChangeDetail;
  images?: MeterChangePhotoInput[];
}
