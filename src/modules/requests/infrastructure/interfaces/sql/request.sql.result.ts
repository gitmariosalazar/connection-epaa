export interface RequestSqlResult {
  request_id: string;
  client_id: string;
  person_type: string;
  connection_type: string;
  property_use: string;
  address: string;
  cadastral_key: string;
  geom: string | null;
  status: string;
  additional_info: Record<string, any>;
  analystic_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentoAdjuntoSqlResult {
  id: string;
  tipodocumento: string;
  url: string;
  estadoValidacion: string;
  observacion: string | null;
}

export interface ExpedienteSqlResult {
  solicitud_id: string;
  solicitud_numero: string | null;
  estado: string;
  tipo_persona: string;
  tipo_acometida: string;
  uso_predio: string;
  direccion: string;
  clave_catastral: string;
  coordenadas: string | null;
  datos_adicionales: Record<string, any> | null;
  fecha_solicitud: Date;
  updated_at: Date;
  dias_en_proceso: number;
  cliente_id: string;
  analista_username: string | null;
  documentos: DocumentoAdjuntoSqlResult[] | null;
  id_factura: string | null;
  numero_factura: string | null;
  monto_factura: number | string | null;
  estado_pago: string | null;
  fecha_vencimiento: Date | null;
  fecha_pago: Date | null;
  metodo_pago: string | null;
  id_informe: string | null;
  resultado_informe: string | null;
  costo_materiales: number | string | null;
  costo_mano_obra: number | string | null;
  costo_total: number | string | null;
  informe_aprobado: boolean | null;
  motivo_rechazo: string | null;
  id_contrato: string | null;
  numero_contrato: string | null;
  estado_firma: string | null;
  valor_total: number | string | null;
  url_contrato_firmado: string | null;
  numero_cuenta: string | null;
  numero_medidor: string | null;
  servicio_activo: boolean | null;
  fecha_activacion: Date | null;
}

export interface PhoneSqlResponse {
  telefono_id: number;
  numero: string;
}

export interface EmailSqlResponse {
  correo_electronico_id: number;
  correo: string;
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
  is_deceased: boolean | null | number;
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

export interface RequestDetailByClientSqlResult extends ExpedienteSqlResult {
  company: CompanySqlResponse | null;
  person: ClientSqlResponse | null;
}

export interface HistorialEstadoSqlResult {
  estado_anterior: string;
  estado_nuevo: string;
  comentario: string | null;
  fecha_cambio: Date;
  realizado_por: string | null;
}

export interface DashboardKpisSqlResult {
  total_solicitudes: number | string;
  en_borrador: number | string;
  en_proceso: number | string;
  completadas: number | string;
  rechazadas: number | string;
  promedio_dias_proceso: number | string | null;
}

export interface SolicitudOrdenTrabajoSqlResult {
  tipo_orden: string;
  codigo_orden: string;
  descripcion: string;
  estado_ot: string;
  prioridad: string;
  fecha_creacion: Date;
  fecha_asignacion: Date | null;
  fecha_completada: Date | null;
  tecnico_asignado: string | null;
}

export interface HistorialTrackingSqlResult {
  estado: string;
  estadoLabel: string;
  estadoAnterior: string | null;
  fecha: Date;
  comentario: string | null;
}

export interface TrackingSolicitudSqlResult {
  id_solicitud: string;
  numero_solicitud: string;
  tipo_acometida: string;
  uso_predio: string;
  direccion: string;
  clave_catastral: string | null;
  fecha_creacion: string;
  estado_codigo: string;
  estado_actual_label: string;
  dias_en_proceso: number | null;
  ultimo_movimiento: Date | null;
  ultimo_comentario: string | null;
  docs_total: number | null;
  docs_aprobados: number | null;
  docs_rechazados: number | null;
  numero_factura: string | null;
  monto_inspeccion: number | string | null;
  estado_pago: string | null;
  fecha_vencimiento: Date | null;
  fecha_pago: Date | null;
  metodo_pago: string | null;
  resultado_inspeccion: string | null;
  distancia_red_m: number | string | null;
  costo_estimado: number | string | null;
  informe_aprobado: boolean | null;
  obs_inspeccion: string | null;
  numero_contrato: string | null;
  valor_contrato: number | string | null;
  estado_firma: string | null;
  fecha_firma_usuario: Date | null;
  fecha_firma_epaa: Date | null;
  numero_medidor: string | null;
  numero_cuenta: string | null;
  servicio_activo: boolean | null;
  fecha_activacion: Date | null;
  analista: string | null;
  historial: HistorialTrackingSqlResult[] | null;
  created_at: Date;
  updated_at: Date;
}
