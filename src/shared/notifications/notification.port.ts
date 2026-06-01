/**
 * INotificationPort — Puerto de salida (DIP).
 * Cubre los 11 puntos de notificación del proceso BPMN de Acometidas.
 * Métodos void — fire-and-forget, nunca bloquean el flujo principal.
 */
export interface INotificationPort {
  // ── Fase 2 ───────────────────────────────────────────────────────────────────────────
  /** Documentos enviados por el cliente (DRAFT → DOCS_SUBMITTED) → al ANALISTA + EMAIL al cliente */
  notifyDocsSubmitted(
    userId: string,
    solicitudId: string,
    numDocumentos: number,
    clientData?: {
      nombre?: string;
      numeroSolicitud?: string;
      tipoAcometida?: string;
      tipoPersona?: string;
      direccion?: string;
      claveCatastral?: string;
    },
  ): void;

  /**
   * Nueva solicitud asignada al analista por round-robin.
   * Canal: EMAIL (template nueva-solicitud-analista.html) + IN_APP.
   */
  notifyAnalystNewSolicitud(
    analistaId: string,
    solicitudId: string,
    numDocumentos: number,
    data: {
      numeroSolicitud: string;
      tipoAcometida:   string;
      tipoPersona:     string;
      direccion:       string;
      claveCatastral:  string;
    },
  ): void;

  // ── Fase 3 ─────────────────────────────────────────────────────────────────
  /** Documentos rechazados → al CLIENTE */
  notifyDocsRechazados(userId: string, solicitudId: string, motivo: string): void;
  /** Documentos aprobados → al CLIENTE */
  notifyDocsAprobados(userId: string, solicitudId: string): void;

  // ── Fase 4 ─────────────────────────────────────────────────────────────────
  /** Inspección asignada → al TÉCNICO */
  notifyInspeccionAsignada(userId: string, solicitudId: string, direccion: string): void;

  // ── Fase 7 ─────────────────────────────────────────────────────────────────
  /** OT de instalación emitida → al TÉCNICO */
  notifyOTInstalacionEmitida(userId: string, solicitudId: string, codigoOT: string): void;

  // ── Fase 8 ─────────────────────────────────────────────────────────────────
  /** Informe técnico subido → a la JEFATURA */
  notifyInformeSubido(userId: string, solicitudId: string): void;

  // ── Fase 9 ─────────────────────────────────────────────────────────────────
  /** Informe técnico aprobado → al CLIENTE */
  notifyInformeAprobado(userId: string, solicitudId: string): void;
  /** Informe técnico rechazado → al CLIENTE */
  notifyInformeRechazado(userId: string, solicitudId: string, motivoRechazo: string): void;

  // ── Fase 10 ────────────────────────────────────────────────────────────────
  /** Factura de inspección emitida → al CLIENTE */
  notifyFacturaEmitida(userId: string, solicitudId: string, monto: number, numerofactura: string): void;

  // ── Fase 11 ────────────────────────────────────────────────────────────────
  /** Pago confirmado → al CLIENTE */
  notifyPagoConfirmado(userId: string, solicitudId: string): void;

  // ── Fase 12 ────────────────────────────────────────────────────────────────
  /** Contrato generado → al CLIENTE */
  notifyContratoGenerado(userId: string, solicitudId: string, numeroContrato: string): void;

  // ── Fase 14 ────────────────────────────────────────────────────────────────
  /** Suministro activo (cierre BPMN) → al CLIENTE */
  notifySuministroActivo(userId: string, solicitudId: string, numeroCuenta: string, numeroMedidor: string): void;
}
