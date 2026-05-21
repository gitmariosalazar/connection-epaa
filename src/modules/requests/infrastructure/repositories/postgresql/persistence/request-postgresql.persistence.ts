import { Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../../domain/contracts/new-connection-request.interface.repository';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { RequestModel } from '../../../../domain/schemas/models/RequestModel';
import { RequestSqlResult } from '../../../interfaces/sql/request.sql.result';
import { RequestAdapter } from '../../../adapters/request.adapter';
import {
  DashboardKpisResponse,
  ExpedienteResponse,
  HistorialEstadoResponse,
  SolicitudOrdenTrabajoResponse,
} from '../../../../application/dto/response/request-queries.response';
import {
  SubmitWithDocumentsRequest,
  SubmitWithDocumentsResponse,
} from '../../../../application/dto/request/submit-with-documents.request';
import { UploadFileService } from '../../../../../documents/application/services/upload-file.service';

@Injectable()
export class RequestPostgreSQLPersistence implements InterfaceConnectionRequestRepository {
  constructor(
    private readonly databaseSService: DatabaseAbstract,
    private readonly uploadFileService: UploadFileService,
  ) {}

  async createConnectionRequest(
    request: RequestModel,
  ): Promise<RequestModel | null> {
    const query: string = `
    INSERT INTO acometidas.solicitud (
        id_cliente, tipo_persona, tipo_acometida, uso_predio, direccion, clave_catastral, geom, datos_adicionales  
    ) VALUES (  
        $1, $2, $3, $4, $5, $6, CASE WHEN CAST($7 AS text) IS NULL THEN NULL ELSE ST_GeomFromText(CAST($7 AS text), 4326) END, $8
    ) RETURNING
      id_solicitud AS request_id,
      id_cliente AS client_id,
      tipo_persona AS person_type,
      tipo_acometida AS connection_type,
      uso_predio AS property_use,
      direccion AS address,
      clave_catastral AS cadastral_key,
      ST_AsText(geom) AS geom,
      estado AS status,
      datos_adicionales AS additional_info,
      id_analista AS analystic_id,
      created_at,
      updated_at;
    `;

    const values = [
      request.clientId,
      request.personType,
      request.connectionType,
      request.propertyUse,
      request.address,
      request.cadastralKey,
      request.geom,
      JSON.stringify(request.additionalInfo ?? {}),
    ];

    try {
      const result = await this.databaseSService.query<RequestSqlResult>(
        query,
        values,
      );
      if (result.length > 0) {
        const model: RequestModel = RequestAdapter.toRequestModelFromSqlResult(
          result[0],
        );
        return model;
      }
      return null;
    } catch (error) {
      console.error('Error creating new connection request:', error);
      throw error;
    }
  }

  async updateConnectionRequest(
    requestId: string,
    updateData: Partial<RequestModel>,
  ): Promise<RequestModel | null> {
    try {
      const existingRequest: RequestModel | null =
        await this.getConnectionRequestById(requestId);
      if (!existingRequest) {
        return null;
      }

      const updatedRequest: RequestModel = {
        ...existingRequest,
        ...updateData,
        updatedAt: new Date(),
      };

      const query: string = `
        UPDATE acometidas.solicitud
        SET
          direccion = $1,
          clave_catastral = $2,
          geom = CASE WHEN CAST($3 AS text) IS NULL THEN NULL ELSE ST_GeomFromText(CAST($3 AS text), 4326) END,
          datos_adicionales = $4,
          id_analista = $5,
          updated_at = $6
        WHERE id_solicitud = $7 AND is_deleted = FALSE
        RETURNING
          id_solicitud AS request_id,
          id_cliente AS client_id,
          tipo_persona AS person_type,
          tipo_acometida AS connection_type,
          uso_predio AS property_use,
          direccion AS address,
          clave_catastral AS cadastral_key,
          ST_AsText(geom) AS geom,
          estado AS status,
          datos_adicionales AS additional_info,
          id_analista AS analystic_id,
          created_at,
          updated_at;
      `;

      const values = [
        updatedRequest.address,
        updatedRequest.cadastralKey,
        updatedRequest.geom,
        JSON.stringify(updatedRequest.additionalInfo ?? {}),
        updatedRequest.analysticId,
        updatedRequest.updatedAt,
        requestId,
      ];

      const result = await this.databaseSService.query<RequestSqlResult>(
        query,
        values,
      );

      if (result.length > 0) {
        const model: RequestModel = RequestAdapter.toRequestModelFromSqlResult(
          result[0],
        );
        return model;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async getConnectionRequestById(
    requestId: string,
  ): Promise<RequestModel | null> {
    try {
      const query: string = `
        SELECT
          id_solicitud AS request_id,
          id_cliente AS client_id,
          tipo_persona AS person_type,
          tipo_acometida AS connection_type,
          uso_predio AS property_use,
          direccion AS address,
          clave_catastral AS cadastral_key,
          ST_AsText(geom) AS geom,
          estado AS status,
          datos_adicionales AS additional_info,
          id_analista AS analystic_id,
          created_at,
          updated_at
        FROM acometidas.solicitud
        WHERE id_solicitud = $1 AND is_deleted = FALSE;
      `;

      const result = await this.databaseSService.query<RequestSqlResult>(
        query,
        [requestId],
      );

      if (result.length > 0) {
        const model: RequestModel = RequestAdapter.toRequestModelFromSqlResult(
          result[0],
        );
        return model;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async findAllConnectionRequests(
    limit: number,
    offset: number,
    status?: string,
  ): Promise<RequestModel[]> {
    try {
      const query: string = `
        SELECT
          id_solicitud AS request_id,
          id_cliente AS client_id,
          tipo_persona AS person_type,
          tipo_acometida AS connection_type,
          uso_predio AS property_use,
          direccion AS address,
          clave_catastral AS cadastral_key,
          ST_AsText(geom) AS geom,
          estado AS status,
          datos_adicionales AS additional_info,
          id_analista AS analystic_id,
          created_at,
          updated_at
        FROM acometidas.solicitud
        WHERE is_deleted = FALSE
          AND ($3::text IS NULL OR estado = $3)
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      const result = await this.databaseSService.query<RequestSqlResult>(
        query,
        [limit, offset, status ?? null],
      );

      return result.map((row) =>
        RequestAdapter.toRequestModelFromSqlResult(row),
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteConnectionRequest(requestId: string): Promise<boolean> {
    try {
      const query: string = `
      UPDATE acometidas.solicitud
      SET 
        is_deleted = TRUE,
        deleted_at = NOW()
      WHERE id_solicitud = $1 AND is_deleted = FALSE;
      `;

      const result = await this.databaseSService.execute(query, [requestId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transición de estado segura: SIEMPRE via fn_cambiar_estado_solicitud.
   * Nunca usar UPDATE acometidas.solicitud SET estado = ... directamente.
   */
  async changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void> {
    await this.databaseSService.query(
      `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
      [solicitudId, newStatus, userId, comment],
    );
  }

  async submitWithDocuments(
    dto: SubmitWithDocumentsRequest,
  ): Promise<SubmitWithDocumentsResponse> {
    return this.databaseSService.transaction(async (client) => {
      // PASO 1: Crear la solicitud (inicia en DRAFT automáticamente)
      const solicitudRows = await client.query<{ id_solicitud: string }>(
        `INSERT INTO acometidas.solicitud (
            id_cliente, tipo_persona, tipo_acometida, uso_predio,
            direccion, clave_catastral, geom, datos_adicionales
         ) VALUES ($1, $2, $3, $4, $5, $6,
            CASE WHEN $7::float IS NOT NULL AND $8::float IS NOT NULL
                 THEN ST_SetSRID(ST_MakePoint($7::float, $8::float), 4326)
                 ELSE NULL END,
            $9::jsonb)
         RETURNING id_solicitud`,
        [
          dto.clientId, dto.personType, dto.connectionType, dto.propertyUse,
          dto.address, dto.cadastralKey,
          dto.longitude ?? null, dto.latitude ?? null,
          JSON.stringify(dto.additionalInfo ?? {}),
        ],
      );
      const solicitudId = solicitudRows[0].id_solicitud;

      // PASO 2: Guardar cada archivo en storage y hacer INSERT batch
      for (const doc of dto.documents ?? []) {
        // Subir al storage local → obtiene fileUrl real
        const stored = await this.uploadFileService.uploadDocument({
          fileBase64:  (doc as any).fileBase64,
          fileUrl:     (doc as any).fileUrl,
          originalName: doc.originalName,
          mimeType:    doc.mimeType,
          sizeInBytes: doc.sizeInBytes,
        });

        await client.query(
          `INSERT INTO acometidas.documento_adjunto (
              id_solicitud, id_tipo_documento, url_archivo,
              nombre_original, mime_type, tamano_bytes, hash_sha256
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            solicitudId, doc.documentTypeId,
            stored.fileUrl, stored.mimeType === doc.mimeType ? doc.originalName : doc.originalName,
            stored.mimeType, stored.sizeInBytes, stored.hashSha256,
          ],
        );
      }

      // PASO 3: Transición DRAFT → DOCS_SUBMITTED
      // p_id_usuario espera UUID del usuario autenticado, NO el clientId (cédula)
      await client.query(
        `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
        [
          solicitudId, 'DOCS_SUBMITTED', dto.userId,
          'Documentación inicial enviada por el cliente',
        ],
      );

      return {
        solicitudId,
        estado: 'DOCS_SUBMITTED',
        documentosInsertados: dto.documents?.length ?? 0,
      };
    });
  }

  // ── Consultas enriquecidas para el frontend ──────────────────────────────

  async getExpedienteBySolicitudId(
    solicitudId: string,
  ): Promise<ExpedienteResponse | null> {
    const result = await this.databaseSService.query<any>(
      `SELECT
          s.id_solicitud AS solicitud_id, s.estado, s.tipo_persona, s.tipo_acometida,
          s.uso_predio, s.direccion, s.clave_catastral,
          ST_AsText(s.geom) AS coordenadas, s.datos_adicionales,
          s.created_at AS fecha_solicitud, s.updated_at,
          EXTRACT(DAY FROM (NOW() - s.created_at))::INT AS dias_en_proceso,
          s.id_cliente AS cliente_id,
          a.username AS analista_username,
          -- Documentos como JSON array
          COALESCE(json_agg(DISTINCT jsonb_build_object(
            'id', d.id_documento, 'tipodocumento', d.id_tipo_documento,
            'url', d.url_archivo, 'estadoValidacion', d.estado_validacion,
            'observacion', d.observacion
          )) FILTER (WHERE d.id_documento IS NOT NULL), '[]') AS documentos,
          -- Factura
          f.id_factura, f.numero_factura, f.monto AS monto_factura,
          f.estado AS estado_pago, f.fecha_vencimiento, f.fecha_pago, f.metodo_pago,
          -- Informe
          i.id_informe, i.resultado AS resultado_informe,
          i.costo_materiales, i.costo_mano_obra, i.costo_total,
          i.aprobado AS informe_aprobado, i.motivo_rechazo,
          -- Contrato
          c.id_contrato, c.numero_contrato, c.estado_firma, c.valor_total,
          c.url_contrato_firmado,
          -- Registro catastral
          r.numero_cuenta, r.numero_medidor, r.activo AS servicio_activo, r.fecha_activacion
        FROM acometidas.solicitud s
        LEFT JOIN public.usuarios a ON a.usuario_id = s.id_analista
        LEFT JOIN acometidas.documento_adjunto d ON d.id_solicitud = s.id_solicitud AND d.is_deleted = FALSE
        LEFT JOIN acometidas.factura_inspeccion f ON f.id_solicitud = s.id_solicitud
        LEFT JOIN acometidas.informe_inspeccion i ON i.id_solicitud = s.id_solicitud AND i.is_deleted = FALSE
        LEFT JOIN acometidas.contrato_servicio c ON c.id_solicitud = s.id_solicitud AND c.is_deleted = FALSE
        LEFT JOIN acometidas.registro_catastral r ON r.id_solicitud = s.id_solicitud AND r.is_deleted = FALSE
        WHERE s.id_solicitud = $1 AND s.is_deleted = FALSE
        GROUP BY s.id_solicitud, a.username, f.id_factura, i.id_informe, c.id_contrato, r.id_registro`,
      [solicitudId],
    );
    if (result.length === 0) return null;
    const row = result[0];
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
      diasEnProceso: row.dias_en_proceso,
      clienteId: row.cliente_id,
      analistaUsername: row.analista_username,
      documentos: row.documentos ?? [],
      facturaId: row.id_factura,
      numeroFactura: row.numero_factura,
      montofactura: row.monto_factura,
      estadoPago: row.estado_pago,
      fechaVencimiento: row.fecha_vencimiento,
      fechaPago: row.fecha_pago,
      metodoPago: row.metodo_pago,
      informeId: row.id_informe,
      resultadoInforme: row.resultado_informe,
      costoMateriales: row.costo_materiales,
      costoManoObra: row.costo_mano_obra,
      costoTotal: row.costo_total,
      informeAprobado: row.informe_aprobado,
      motivoRechazo: row.motivo_rechazo,
      contratoId: row.id_contrato,
      numeroContrato: row.numero_contrato,
      estadoFirma: row.estado_firma,
      valorTotal: row.valor_total,
      urlContratoFirmado: row.url_contrato_firmado,
      numeroCuenta: row.numero_cuenta,
      numeroMedidor: row.numero_medidor,
      servicioActivo: row.servicio_activo,
      fechaActivacion: row.fecha_activacion,
    } as ExpedienteResponse;
  }

  async getHistorialBySolicitudId(
    solicitudId: string,
  ): Promise<HistorialEstadoResponse[]> {
    const result = await this.databaseSService.query<any>(
      `SELECT
          h.estado_anterior, h.estado_nuevo, h.comentario,
          h.fecha_cambio, u.username AS realizado_por
        FROM acometidas.historial_estado h
        LEFT JOIN public.usuarios u ON u.usuario_id = h.id_usuario_accion
        WHERE h.id_solicitud = $1
        ORDER BY h.fecha_cambio ASC`,
      [solicitudId],
    );
    return result.map((row) => ({
      estadoAnterior: row.estado_anterior,
      estadoNuevo: row.estado_nuevo,
      comentario: row.comentario,
      fechaCambio: row.fecha_cambio,
      realizadoPor: row.realizado_por,
    }));
  }

  async getDashboardKpis(): Promise<DashboardKpisResponse> {
    const result = await this.databaseSService.query<any>(
      `SELECT
          COUNT(*) FILTER (WHERE is_deleted = FALSE) AS total_solicitudes,
          COUNT(*) FILTER (WHERE estado = 'DRAFT' AND is_deleted = FALSE) AS en_borrador,
          COUNT(*) FILTER (WHERE estado IN (
            'DOCS_SUBMITTED','DOCS_APPROVED','FACTURA_INSPECCION_EMITIDA',
            'PAGO_CONFIRMADO','ORDEN_INSPECCION_EMITIDA','INSPECCION_EN_PROCESO',
            'INFORME_EN_REVISION','INFORME_APROBADO','CONTRATO_GENERADO',
            'CONTRATO_FIRMADO','OT_INSTALACION_EMITIDA','INSTALACION_EN_PROCESO',
            'REGISTRO_CATASTRAL_PENDIENTE'
          ) AND is_deleted = FALSE) AS en_proceso,
          COUNT(*) FILTER (WHERE estado = 'SUMINISTRO_ACTIVO' AND is_deleted = FALSE) AS completadas,
          COUNT(*) FILTER (WHERE estado IN ('DOCS_REJECTED','RECHAZADA_TECNICA','ANULADA') AND is_deleted = FALSE) AS rechazadas,
          ROUND(AVG(EXTRACT(DAY FROM (updated_at - created_at)))
            FILTER (WHERE estado = 'SUMINISTRO_ACTIVO'), 1) AS promedio_dias_proceso
        FROM acometidas.solicitud`,
      [],
    );
    const row = result[0];
    return {
      totalSolicitudes: Number(row.total_solicitudes),
      enBorrador: Number(row.en_borrador),
      enProceso: Number(row.en_proceso),
      completadas: Number(row.completadas),
      rechazadas: Number(row.rechazadas),
      promedioDiasProceso: row.promedio_dias_proceso
        ? Number(row.promedio_dias_proceso)
        : null,
    };
  }

  async getOrdenesTrabajoBysSolicitudId(
    solicitudId: string,
  ): Promise<SolicitudOrdenTrabajoResponse[]> {
    const result = await this.databaseSService.query<any>(
      `SELECT
          sot.tipo_orden,
          ot.codigo_orden, ot.descripcion,
          eot.nombre_estado AS estado_ot,
          pot.nivel AS prioridad,
          ot.fecha_creacion, ot.fecha_asignacion, ot.fecha_completada,
          u.username AS tecnico_asignado
        FROM acometidas.solicitud_orden_trabajo sot
        JOIN work_orders.orden_trabajo ot ON ot.id_orden_trabajo = sot.id_orden_trabajo
        JOIN work_orders.estado_orden_trabajo eot ON eot.id_estado = ot.estado
        JOIN work_orders.prioridad_orden_trabajo pot ON pot.id_prioridad = ot.id_prioridad
        LEFT JOIN public.usuarios u ON u.usuario_id = ot.usuario_asignacion
        WHERE sot.id_solicitud = $1
        ORDER BY ot.fecha_creacion ASC`,
      [solicitudId],
    );
    return result.map((row) => ({
      tipoOrden: row.tipo_orden,
      codigoOrden: row.codigo_orden,
      descripcion: row.descripcion,
      estadoOt: row.estado_ot,
      prioridad: row.prioridad,
      fechaCreacion: row.fecha_creacion,
      fechaAsignacion: row.fecha_asignacion,
      fechaCompletada: row.fecha_completada,
      tecnicoAsignado: row.tecnico_asignado,
    }));
  }
}
