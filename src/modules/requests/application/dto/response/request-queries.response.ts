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
