import { RequestModel } from '../schemas/models/RequestModel';
import {
  DashboardKpisResponse,
  ExpedienteResponse,
  HistorialEstadoResponse,
  RequestDetailByClientResponse,
  SolicitudOrdenTrabajoResponse,
  TrackingSolicitudResponse,
} from '../../application/dto/response/request-queries.response';
import {
  SubmitWithDocumentsRequest,
  SubmitWithDocumentsResponse,
} from '../../application/dto/request/submit-with-documents.request';

export interface InterfaceConnectionRequestRepository {
  createConnectionRequest(request: RequestModel): Promise<RequestModel | null>;
  updateConnectionRequest(
    requestId: string,
    updateData: Partial<RequestModel>,
  ): Promise<RequestModel | null>;
  getConnectionRequestById(requestId: string): Promise<RequestModel | null>;
  findAllConnectionRequests(
    limit: number,
    offset: number,
    status?: string,
  ): Promise<RequestModel[]>;
  deleteConnectionRequest(requestId: string): Promise<boolean>;
  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;

  /**
   * OPERACIÓN ATÓMICA: Crea la solicitud, inserta documentos y transiciona
   * a DOCS_SUBMITTED en una única transacción PostgreSQL.
   */
  submitWithDocuments(
    dto: SubmitWithDocumentsRequest,
  ): Promise<SubmitWithDocumentsResponse>;

  // ── Consultas enriquecidas para el frontend ──────────────────────────────
  /** Expediente completo de una solicitud (todos los módulos en un solo query) */
  getExpedienteBySolicitudId(
    solicitudId: string,
  ): Promise<ExpedienteResponse | null>;
  getRequestDetailByRequestIdOrNumber(
    requestNumberOrId: string,
  ): Promise<RequestDetailByClientResponse | null>;
  getExpedientesByAnalistaId(analistaId: string): Promise<ExpedienteResponse[]>;
  getExpedientesByClienteId(clienteId: string): Promise<ExpedienteResponse[]>;
  /** Timeline de cambios de estado para el stepper del frontend */
  getHistorialBySolicitudId(
    solicitudId: string,
  ): Promise<HistorialEstadoResponse[]>;
  /** Métricas globales para el panel administrativo */
  getDashboardKpis(): Promise<DashboardKpisResponse>;
  /** Órdenes de trabajo (inspección e instalación) ligadas a una solicitud */
  getOrdenesTrabajoBysSolicitudId(
    solicitudId: string,
  ): Promise<SolicitudOrdenTrabajoResponse[]>;

  /**
   * Tracking en tiempo real: retorna todas las solicitudes de un cliente
   * enriquecidas con fase del BPMN, métricas y timeline para el wizard del frontend.
   */
  getTrackingByClienteId(
    clienteId: string,
  ): Promise<TrackingSolicitudResponse[]>;
  getTrackingBySolicitudId(
    solicitudId: string,
  ): Promise<TrackingSolicitudResponse | null>;
  getTrackingByAnalistaId(
    analistaId: string,
  ): Promise<TrackingSolicitudResponse[]>;
}
