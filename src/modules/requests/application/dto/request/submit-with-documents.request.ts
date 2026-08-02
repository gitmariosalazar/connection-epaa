/**
 * DTO para la operación atómica de creación + carga de documentos + envío.
 * Se ejecuta en una sola transacción PostgreSQL:
 *   1. INSERT INTO acometidas.solicitud  → id_solicitud
 *   2. INSERT INTO acometidas.documento_adjunto (batch)
 *   3. fn_cambiar_estado_solicitud(id, 'DOCS_SUBMITTED', ...)
 */
export class SubmitWithDocumentsRequest {
  constructor(
    // ── Datos de la solicitud ──────────────────────────────────
    public readonly clientId: string, // cédula del cliente (varchar 13)
    public readonly userId: string, // UUID del usuario autenticado (para auditoría)
    public readonly personType: string,
    public readonly connectionType: string,
    public readonly propertyUse: string,
    public readonly address: string,
    public readonly cadastralKey: string,
    public readonly longitude: number | null,
    public readonly latitude: number | null,
    public readonly additionalInfo: Record<string, any>,
    // ── Documentos adjuntos ────────────────────────────────────
    public readonly documents: SubmitDocumentItem[],
  ) {}
}

export class SubmitDocumentItem {
  constructor(
    public readonly documentTypeId: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly sizeInBytes: number,
    /** Referencia a un archivo ya guardado en disco (preferido: evita mandar el archivo por Kafka). */
    public readonly fileUrl?: string,
    public readonly hashSha256?: string,
    /** Alternativa legacy: archivo completo codificado en base64. */
    public readonly fileBase64?: string,
  ) {}
}

export interface SubmitWithDocumentsResponse {
  solicitudId: string;
  /** Número legible generado por el trigger: SOL-EPAA-2026-0000035 */
  numeroSolicitud: string;
  estado: string;
  documentosInsertados: number;
  /** UUID del analista asignado por round-robin. null si no hay analistas activos. */
  analistaId: string | null;
}
