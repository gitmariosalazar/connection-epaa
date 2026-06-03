import { CreateRequestRequest } from '../../application/dto/request/create-request.request';
import { RequestResponse } from '../../application/dto/response/request.response';
import {
  ClientResponse,
  CompanyResponse,
  DashboardKpisResponse,
  EmailResponse,
  ExpedienteResponse,
  HistorialEstadoResponse,
  PhoneResponse,
  RequestDetailByClientResponse,
  SolicitudOrdenTrabajoResponse,
  TrackingSolicitudResponse,
} from '../../application/dto/response/request-queries.response';
import { RequestModel } from '../../domain/schemas/models/RequestModel';
import {
  ClientSqlResponse,
  CompanySqlResponse,
  DashboardKpisSqlResult,
  EmailSqlResponse,
  ExpedienteSqlResult,
  HistorialEstadoSqlResult,
  PhoneSqlResponse,
  RequestDetailByClientSqlResult,
  RequestSqlResult,
  SolicitudOrdenTrabajoSqlResult,
  TrackingSolicitudSqlResult,
} from '../interfaces/sql/request.sql.result';

export class RequestAdapter {
  private static toPhoneResponse(phone: PhoneSqlResponse): PhoneResponse {
    return {
      telefonoId: phone.telefono_id,
      numero: phone.numero,
    };
  }

  private static toEmailResponse(email: EmailSqlResponse): EmailResponse {
    return {
      correoElectronicoId: email.correo_electronico_id,
      correo: email.correo,
    };
  }

  private static toClientResponse(client: ClientSqlResponse): ClientResponse {
    return {
      address: client.address,
      country: client.country,
      genderId: client.gender_id,
      lastName: client.last_name,
      parishId: client.parish_id,
      personId: client.person_id,
      birthDate: client.birth_date,
      firstName: client.first_name,
      isDeceased: client.is_deceased,
      professionId: client.profession_id,
      civilStatusId: client.civil_status_id,
      phones: (client.phones ?? []).map(RequestAdapter.toPhoneResponse),
      emails: (client.emails ?? []).map(RequestAdapter.toEmailResponse),
    };
  }

  private static toCompanyResponse(
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
      phones: (company.phones ?? []).map(RequestAdapter.toPhoneResponse),
      emails: (company.emails ?? []).map(RequestAdapter.toEmailResponse),
    };
  }

  private static toNumberOrNull(
    value: number | string | null | undefined,
  ): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }

  private static toNumber(
    value: number | string | null | undefined,
    fallback = 0,
  ): number {
    if (value === null || value === undefined) {
      return fallback;
    }

    return Number(value);
  }

  static toResponse(requestModel: RequestModel): RequestResponse {
    return {
      requestId: requestModel.requestId,
      clientId: requestModel.clientId,
      personType: requestModel.personType,
      connectionType: requestModel.connectionType,
      propertyUse: requestModel.propertyUse,
      address: requestModel.address,
      cadastralKey: requestModel.cadastralKey,
      geom: requestModel.geom,
      status: requestModel.status,
      additionalInfo: requestModel.additionalInfo,
      analysticId: requestModel.analysticId,
      createdAt: requestModel.createdAt,
      updatedAt: requestModel.updatedAt,
    };
  }

  static toRequestModel(
    createRequestRequest: CreateRequestRequest,
    requestId: string,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ): RequestModel {
    return new RequestModel(
      requestId,
      createRequestRequest.clientId,
      createRequestRequest.personType,
      createRequestRequest.connectionType,
      createRequestRequest.propertyUse,
      createRequestRequest.address,
      createRequestRequest.cadastralKey,
      createRequestRequest.geom,
      status,
      createRequestRequest.additionalInfo,
      null,
      createdAt,
      updatedAt,
    );
  }

  static toRequestModelFromSqlResult(
    requestSqlResult: RequestSqlResult,
  ): RequestModel {
    return new RequestModel(
      requestSqlResult.request_id,
      requestSqlResult.client_id,
      requestSqlResult.person_type,
      requestSqlResult.connection_type,
      requestSqlResult.property_use,
      requestSqlResult.address,
      requestSqlResult.cadastral_key,
      requestSqlResult.geom,
      requestSqlResult.status,
      requestSqlResult.additional_info,
      requestSqlResult.analystic_id,
      requestSqlResult.created_at,
      requestSqlResult.updated_at,
    );
  }

  static toExpedienteResponseFromSqlResult(
    row: ExpedienteSqlResult,
  ): ExpedienteResponse {
    return {
      solicitudId: row.solicitud_id,
      estado: row.estado,
      tipoPersona: row.tipo_persona,
      tipoAcometida: row.tipo_acometida,
      usoPredio: row.uso_predio,
      direccion: row.direccion,
      claveCatastral: row.clave_catastral,
      coordenadas: row.coordenadas,
      datosAdicionales: row.datos_adicionales ?? {},
      fechaSolicitud: row.fecha_solicitud,
      updatedAt: row.updated_at,
      diasEnProceso: RequestAdapter.toNumber(row.dias_en_proceso),
      clienteId: row.cliente_id,
      analistaUsername: row.analista_username,
      documentos: row.documentos ?? [],
      facturaId: row.id_factura,
      numeroFactura: row.numero_factura,
      montofactura: RequestAdapter.toNumberOrNull(row.monto_factura),
      estadoPago: row.estado_pago,
      fechaVencimiento: row.fecha_vencimiento,
      fechaPago: row.fecha_pago,
      metodoPago: row.metodo_pago,
      informeId: row.id_informe,
      resultadoInforme: row.resultado_informe,
      costoMateriales: RequestAdapter.toNumberOrNull(row.costo_materiales),
      costoManoObra: RequestAdapter.toNumberOrNull(row.costo_mano_obra),
      costoTotal: RequestAdapter.toNumberOrNull(row.costo_total),
      informeAprobado: row.informe_aprobado,
      motivoRechazo: row.motivo_rechazo,
      contratoId: row.id_contrato,
      numeroContrato: row.numero_contrato,
      estadoFirma: row.estado_firma,
      valorTotal: RequestAdapter.toNumberOrNull(row.valor_total),
      urlContratoFirmado: row.url_contrato_firmado,
      numeroCuenta: row.numero_cuenta,
      numeroMedidor: row.numero_medidor,
      servicioActivo: row.servicio_activo,
      fechaActivacion: row.fecha_activacion,
      solicitudNumero: row.solicitud_numero ?? null,
    };
  }

  static toHistorialEstadoResponseFromSqlResult(
    row: HistorialEstadoSqlResult,
  ): HistorialEstadoResponse {
    return {
      estadoAnterior: row.estado_anterior,
      estadoNuevo: row.estado_nuevo,
      comentario: row.comentario,
      fechaCambio: row.fecha_cambio,
      realizadoPor: row.realizado_por,
    };
  }

  static toRequestDetailByClientResponseFromSqlResult(
    row: RequestDetailByClientSqlResult,
  ): RequestDetailByClientResponse {
    const expediente = RequestAdapter.toExpedienteResponseFromSqlResult(row);

    return {
      ...expediente,
      company: row.company
        ? RequestAdapter.toCompanyResponse(row.company)
        : null,
      person: row.person ? RequestAdapter.toClientResponse(row.person) : null,
    };
  }

  static toDashboardKpisResponseFromSqlResult(
    row: DashboardKpisSqlResult,
  ): DashboardKpisResponse {
    return {
      totalSolicitudes: RequestAdapter.toNumber(row.total_solicitudes),
      enBorrador: RequestAdapter.toNumber(row.en_borrador),
      enProceso: RequestAdapter.toNumber(row.en_proceso),
      completadas: RequestAdapter.toNumber(row.completadas),
      rechazadas: RequestAdapter.toNumber(row.rechazadas),
      promedioDiasProceso: RequestAdapter.toNumberOrNull(
        row.promedio_dias_proceso,
      ),
    };
  }

  static toSolicitudOrdenTrabajoResponseFromSqlResult(
    row: SolicitudOrdenTrabajoSqlResult,
  ): SolicitudOrdenTrabajoResponse {
    return {
      tipoOrden: row.tipo_orden,
      codigoOrden: row.codigo_orden,
      descripcion: row.descripcion,
      estadoOt: row.estado_ot,
      prioridad: row.prioridad,
      fechaCreacion: row.fecha_creacion,
      fechaAsignacion: row.fecha_asignacion,
      fechaCompletada: row.fecha_completada,
      tecnicoAsignado: row.tecnico_asignado,
    };
  }

  static toTrackingSolicitudResponseFromSqlResult(
    row: TrackingSolicitudSqlResult,
    phaseInfo: { step: string; index: number },
  ): TrackingSolicitudResponse {
    const historial = Array.isArray(row.historial)
      ? row.historial.map((entry) => ({
          estado: entry.estado,
          estadoLabel: entry.estadoLabel,
          estadoAnterior: entry.estadoAnterior ?? null,
          fecha: entry.fecha,
          comentario: entry.comentario ?? null,
        }))
      : [];

    return {
      id: row.id_solicitud,
      codigo: row.numero_solicitud,
      tipoAcometida: row.tipo_acometida,
      usoPredio: row.uso_predio,
      direccion: row.direccion,
      claveCatastral: row.clave_catastral ?? null,
      fechaCreacion: row.fecha_creacion,
      estadoCodigo: row.estado_codigo,
      estadoActualLabel: row.estado_actual_label,
      currentStep: phaseInfo.step,
      stepIndex: phaseInfo.index,
      diasEnProceso: RequestAdapter.toNumber(row.dias_en_proceso),
      ultimoMovimiento: row.ultimo_movimiento ?? null,
      ultimoComentario: row.ultimo_comentario ?? null,
      docsTotal: RequestAdapter.toNumber(row.docs_total),
      docsAprobados: RequestAdapter.toNumber(row.docs_aprobados),
      docsRechazados: RequestAdapter.toNumber(row.docs_rechazados),
      numeroFactura: row.numero_factura ?? null,
      montoInspeccion: RequestAdapter.toNumberOrNull(row.monto_inspeccion),
      estadoPago: row.estado_pago ?? null,
      vencimientoPago: row.fecha_vencimiento ?? null,
      fechaPago: row.fecha_pago ?? null,
      metodoPago: row.metodo_pago ?? null,
      resultadoInspeccion: row.resultado_inspeccion ?? null,
      distanciaRedM: RequestAdapter.toNumberOrNull(row.distancia_red_m),
      costoEstimado: RequestAdapter.toNumberOrNull(row.costo_estimado),
      informeAprobado: row.informe_aprobado ?? null,
      obsInspeccion: row.obs_inspeccion ?? null,
      numeroContrato: row.numero_contrato ?? null,
      valorContrato: RequestAdapter.toNumberOrNull(row.valor_contrato),
      estadoFirma: row.estado_firma ?? null,
      fechaFirmaUsuario: row.fecha_firma_usuario ?? null,
      fechaFirmaEpaa: row.fecha_firma_epaa ?? null,
      numeroMedidor: row.numero_medidor ?? null,
      numeroCuenta: row.numero_cuenta ?? null,
      servicioActivo: row.servicio_activo ?? null,
      fechaActivacion: row.fecha_activacion ?? null,
      analista: row.analista ?? null,
      historial,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
