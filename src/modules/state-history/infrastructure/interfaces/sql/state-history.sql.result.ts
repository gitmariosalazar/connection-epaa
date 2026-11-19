export interface StateHistorySQLResult {
  historial_id: string | number;
  acometida_id: string;
  estado_anterior_id: number | null;
  estado_nuevo_id: number;
  fecha_cambio: Date | string;
  fecha_efectiva: Date | string;
  motivo: string | null;
  documento_respaldo: string | null;
  id_documento?: string | null;
  observaciones: string | null;
  usuario_id: string;
  origen: string;
  ip_origen: string | null;
  dispositivo_id: string | null;
  latitude: number | null;
  longitude: number | null;
  es_reverso: boolean;
  historial_origen_id: string | number | null;
  created_at: Date | string;
  // Joined fields
  estado_anterior_nombre?: string | null;
  estado_nuevo_nombre?: string | null;
  permite_facturar?: boolean | null;
  permite_lectura?: boolean | null;
  requiere_inspeccion?: boolean | null;
  usuario_email?: string | null;
  usuario_nombre_completo?: string | null;
}

export interface StateCatalogSQLResult {
  id_estado: number;
  nombre: string;
  descripcion: string;
  permite_facturar: boolean;
  requiere_inspeccion: boolean;
  permite_lectura: boolean;
}

export interface StateSummarySQLResult {
  id_estado: number;
  nombre: string;
  descripcion: string;
  total_acometidas: string | number;
  porcentaje: string | number;
  permite_facturar: boolean;
  permite_lectura: boolean;
  requiere_inspeccion: boolean;
}

export interface ConnectionByStateSQLResult {
  acometida_id: string;
  cuenta: string | null;
  clave_catastral: string | null;
  numero_contrato: string | null;
  sector_id: number | null;
  estado_id: number;
  estado_nombre: string;
  estado_legacy: boolean;
  cliente_nombre: string | null;
  cliente_identificacion: string | null;
  ultimo_cambio_estado: Date | string | null;
}

export interface CurrentConnectionStateSQLResult {
  acometida_id: string;
  estado_id: number;
  estado_nombre: string;
  descripcion: string;
  permite_facturar: boolean;
  permite_lectura: boolean;
  requiere_inspeccion: boolean;
  estado_legacy: boolean;
  ultimo_cambio_fecha: Date | string | null;
  ultimo_motivo: string | null;
  ultimo_origen: string | null;
}
