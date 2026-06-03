// ─── Expediente completo de una solicitud ────────────────────────────────────
export interface DocumentoAdjuntoResponse {
  id: string;
  tipodocumento: string;
  url: string;
  estadoValidacion: string;
  observacion: string | null;
}

export interface ExpedienteResponse {
  // Solicitud
  solicitudId: string;
  estado: string;
  tipoPersona: string;
  tipoAcometida: string;
  usoPredio: string;
  direccion: string;
  claveCatastral: string;
  coordenadas: string | null;
  datosAdicionales: Record<string, any>;
  fechaSolicitud: Date;
  updatedAt: Date;
  diasEnProceso: number;
  // Cliente y analista
  clienteId: string;
  analistaUsername: string | null;
  // Documentos
  documentos: DocumentoAdjuntoResponse[];
  // Factura
  facturaId: string | null;
  numeroFactura: string | null;
  montofactura: number | null;
  estadoPago: string | null;
  fechaVencimiento: Date | null;
  fechaPago: Date | null;
  metodoPago: string | null;
  // Informe técnico
  informeId: string | null;
  resultadoInforme: string | null;
  costoMateriales: number | null;
  costoManoObra: number | null;
  costoTotal: number | null;
  informeAprobado: boolean | null;
  motivoRechazo: string | null;
  // Contrato
  contratoId: string | null;
  numeroContrato: string | null;
  estadoFirma: string | null;
  valorTotal: number | null;
  urlContratoFirmado: string | null;
  // Registro catastral
  numeroCuenta: string | null;
  numeroMedidor: string | null;
  servicioActivo: boolean | null;
  fechaActivacion: Date | null;
  solicitudNumero: string | null;
}

export interface PhoneResponse {
  telefonoId: number;
  numero: string;
}

export interface EmailResponse {
  correoElectronicoId: number;
  correo: string;
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
  isDeceased: boolean | null | number;
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

export interface RequestDetailByClientResponse extends ExpedienteResponse {
  company: CompanyResponse | null;
  person: ClientResponse | null;
}

// ─── Historial de estados ─────────────────────────────────────────────────────
export interface HistorialEstadoResponse {
  estadoAnterior: string;
  estadoNuevo: string;
  comentario: string | null;
  fechaCambio: Date;
  realizadoPor: string | null;
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export interface DashboardKpisResponse {
  totalSolicitudes: number;
  enBorrador: number;
  enProceso: number;
  completadas: number;
  rechazadas: number;
  promedioDiasProceso: number | null;
}

// ─── OTs vinculadas a una solicitud ──────────────────────────────────────────
export interface SolicitudOrdenTrabajoResponse {
  tipoOrden: string;
  codigoOrden: string;
  descripcion: string;
  estadoOt: string;
  prioridad: string;
  fechaCreacion: Date;
  fechaAsignacion: Date | null;
  fechaCompletada: Date | null;
  tecnicoAsignado: string | null;
}

// ─── Tracking en tiempo real (wizard de seguimiento del cliente) ──────────────

export interface HistorialTrackingEntry {
  estado: string;
  estadoLabel: string;
  estadoAnterior: string | null;
  fecha: Date;
  comentario: string | null;
}

export interface TrackingSolicitudResponse {
  // ── Identificación
  id: string; // UUID de la solicitud
  codigo: string; // SOL-EPAA-2026-XXXXXXX
  tipoAcometida: string;
  usoPredio: string;
  direccion: string;
  claveCatastral: string | null;

  // ── Fecha formateada en español
  fechaCreacion: string; // "07 de febrero, 2026"

  // ── Estado actual
  estadoCodigo: string; // "INSTALACION_EN_PROCESO"
  estadoActualLabel: string; // "Instalación en Proceso"

  // ── Paso en el wizard (7 fases del BPMN)
  currentStep: string; // solicitud | documentos | pago | inspeccion | contrato | instalacion | catastro | completado | anulada | rechazada
  stepIndex: number; // 0-6 (progreso), -1 (terminal negativo)

  // ── Métricas
  diasEnProceso: number;
  ultimoMovimiento: Date | null;
  ultimoComentario: string | null;

  // ── Documentos
  docsTotal: number;
  docsAprobados: number;
  docsRechazados: number;

  // ── Pago de inspección
  numeroFactura: string | null;
  montoInspeccion: number | null;
  estadoPago: string | null;
  vencimientoPago: Date | null;
  fechaPago: Date | null;
  metodoPago: string | null;

  // ── Inspección
  resultadoInspeccion: string | null;
  distanciaRedM: number | null;
  costoEstimado: number | null;
  informeAprobado: boolean | null;
  obsInspeccion: string | null;

  // ── Contrato
  numeroContrato: string | null;
  valorContrato: number | null;
  estadoFirma: string | null;
  fechaFirmaUsuario: Date | null;
  fechaFirmaEpaa: Date | null;

  // ── Instalación / Catastro
  numeroMedidor: string | null;
  numeroCuenta: string | null;
  servicioActivo: boolean | null;
  fechaActivacion: Date | null;

  // ── Analista asignado
  analista: string | null;

  // ── Timeline completo (ordenado cronológicamente)
  historial: HistorialTrackingEntry[];

  // ── Auditoría
  createdAt: Date;
  updatedAt: Date;
}
