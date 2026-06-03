import { Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../../domain/contracts/new-connection-request.interface.repository';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { RequestModel } from '../../../../domain/schemas/models/RequestModel';
import {
  DashboardKpisSqlResult,
  ExpedienteSqlResult,
  HistorialEstadoSqlResult,
  RequestDetailByClientSqlResult,
  RequestSqlResult,
  SolicitudOrdenTrabajoSqlResult,
  TrackingSolicitudSqlResult,
} from '../../../interfaces/sql/request.sql.result';
import { RequestAdapter } from '../../../adapters/request.adapter';
import {
  DashboardKpisResponse,
  ExpedienteResponse,
  HistorialEstadoResponse,
  RequestDetailByClientResponse,
  SolicitudOrdenTrabajoResponse,
  TrackingSolicitudResponse,
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
      const solicitudRows = await client.query<{
        id_solicitud: string;
        numero_solicitud: string;
      }>(
        `INSERT INTO acometidas.solicitud (
            id_cliente, tipo_persona, tipo_acometida, uso_predio,
            direccion, clave_catastral, geom, datos_adicionales
         ) VALUES ($1, $2, $3, $4, $5, $6,
            CASE WHEN $7::float IS NOT NULL AND $8::float IS NOT NULL
                 THEN ST_SetSRID(ST_MakePoint($7::float, $8::float), 4326)
                 ELSE NULL END,
            $9::jsonb)
         RETURNING id_solicitud, numero_solicitud`,
        [
          dto.clientId,
          dto.personType,
          dto.connectionType,
          dto.propertyUse,
          dto.address,
          dto.cadastralKey,
          dto.longitude ?? null,
          dto.latitude ?? null,
          JSON.stringify(dto.additionalInfo ?? {}),
        ],
      );
      const solicitudId = solicitudRows[0].id_solicitud;
      const numeroSolicitud = solicitudRows[0].numero_solicitud; // SOL-EPAA-2026-0000035

      // PASO 2: Si el usuario autenticado es analista activo, se autoasigna.
      // En caso contrario, aplicar round-robin entre analistas activos.
      const loggedAnalystRows = await client.query<{ usuario_id: string }>(
        `SELECT e.usuario_id
         FROM public.empleados e
         INNER JOIN public.usuarios u ON u.usuario_id = e.usuario_id
         WHERE e.usuario_id = $1
           AND e.cargo_id = 14
           AND e.estado_empleado_id = 1
           AND u.activo = TRUE
         LIMIT 1`,
        [dto.userId],
      );

      let analistaId: string | null = loggedAnalystRows[0]?.usuario_id ?? null;

      if (!analistaId) {
        // Fallback concurrente seguro: round-robin con bloqueo de fila.
        // FOR UPDATE SKIP LOCKED evita que dos transacciones asignen al mismo analista al mismo tiempo.
        const analistaRows = await client.query<{ usuario_id: string }>(
          `SELECT e.usuario_id
           FROM public.empleados e
           INNER JOIN public.usuarios u ON u.usuario_id = e.usuario_id
           WHERE e.cargo_id = 14
             AND e.estado_empleado_id = 1
             AND u.activo = TRUE
           ORDER BY (
             SELECT COUNT(*)
             FROM acometidas.solicitud s
             WHERE s.id_analista = e.usuario_id
               AND s.estado NOT IN ('SUMINISTRO_ACTIVO', 'ANULADA', 'RECHAZADA_TECNICA')
               AND s.is_deleted = FALSE
           ) ASC,
           e.usuario_id ASC
           FOR UPDATE OF e SKIP LOCKED
           LIMIT 1`,
          [],
        );
        analistaId = analistaRows[0]?.usuario_id ?? null;

        // Si no hay analistas activos disponibles, continúa con null (pendiente de asignación).
      }

      // PASO 3: Asignar el analista a la solicitud (misma transacción — atómico)
      if (analistaId) {
        await client.query(
          `UPDATE acometidas.solicitud SET id_analista = $1 WHERE id_solicitud = $2`,
          [analistaId, solicitudId],
        );
      }

      // PASO 4: Guardar cada archivo en storage y hacer INSERT batch
      for (const doc of dto.documents ?? []) {
        // Subir al storage local → obtiene fileUrl real
        const stored = await this.uploadFileService.uploadDocument({
          fileBase64: (doc as any).fileBase64,
          fileUrl: (doc as any).fileUrl,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          sizeInBytes: doc.sizeInBytes,
        });

        await client.query(
          `INSERT INTO acometidas.documento_adjunto (
              id_solicitud, id_tipo_documento, url_archivo,
              nombre_original, mime_type, tamano_bytes, hash_sha256
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            solicitudId,
            doc.documentTypeId,
            stored.fileUrl,
            stored.mimeType === doc.mimeType
              ? doc.originalName
              : doc.originalName,
            stored.mimeType,
            stored.sizeInBytes,
            stored.hashSha256,
          ],
        );
      }

      // PASO 5: Transición DRAFT → DOCS_SUBMITTED
      // p_id_usuario espera UUID del usuario autenticado, NO el clientId (cédula)
      await client.query(
        `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
        [
          solicitudId,
          'DOCS_SUBMITTED',
          dto.userId,
          'Documentación inicial enviada por el cliente',
        ],
      );

      return {
        solicitudId,
        numeroSolicitud, // SOL-EPAA-2026-XXXXXXX — generado por el trigger
        estado: 'DOCS_SUBMITTED',
        documentosInsertados: dto.documents?.length ?? 0,
        analistaId,
      };
    });
  }

  // ── Consultas enriquecidas para el frontend ──────────────────────────────

  async getExpedienteBySolicitudId(
    solicitudId: string,
  ): Promise<ExpedienteResponse | null> {
    const result = await this.databaseSService.query<ExpedienteSqlResult>(
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
    return RequestAdapter.toExpedienteResponseFromSqlResult(result[0]);
  }

  async getRequestDetailByRequestIdOrNumber(
    requestNumberOrId: string,
  ): Promise<RequestDetailByClientResponse | null> {
    const result =
      await this.databaseSService.query<RequestDetailByClientSqlResult>(
        `SELECT
            -- Datos básicos de la solicitud
            s.id_solicitud AS solicitud_id,
            s.numero_solicitud AS solicitud_numero,
            s.estado,
            s.tipo_persona,
            s.tipo_acometida,
            s.uso_predio,
            s.direccion,
            s.clave_catastral,
            ST_AsText(s.geom) AS coordenadas,
            s.datos_adicionales,
            s.created_at AS fecha_solicitud,
            s.updated_at,
            EXTRACT(DAY FROM (NOW() - s.created_at))::INT AS dias_en_proceso,
            s.id_cliente AS cliente_id,

            -- Analista asignado
            a.username AS analista_username,

            -- Documentos agrupados como JSON array
            COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                    'id', d.id_documento,
                    'tipodocumento', d.id_tipo_documento,
                    'url', d.url_archivo,
                    'estadoValidacion', d.estado_validacion,
                    'observacion', d.observacion
                )) FILTER (WHERE d.id_documento IS NOT NULL),
                '[]'
            ) AS documentos,

            -- Detalle de Factura
            f.id_factura,
            f.numero_factura,
            f.monto AS monto_factura,
            f.estado AS estado_pago,
            f.fecha_vencimiento,
            f.fecha_pago,
            f.metodo_pago,

            -- Detalle del Informe de Inspección
            i.id_informe,
            i.resultado AS resultado_informe,
            i.costo_materiales,
            i.costo_mano_obra,
            i.costo_total,
            i.aprobado AS informe_aprobado,
            i.motivo_rechazo,

            -- Detalle del Contrato
            c.id_contrato,
            c.numero_contrato AS numero_contrato,
            c.estado_firma,
            c.valor_total,
            c.url_contrato_firmado,

            -- Detalle del Registro Catastral final
            r.numero_cuenta,
            r.numero_medidor,
            r.activo AS servicio_activo,
            r.fecha_activacion,

            -- Client Data (Empresa)
            CASE
                WHEN e.ruc IS NOT NULL THEN
                    jsonb_build_object(
                        'company_id', e.empresa_id,
                        'commercial_name', e.nombre_comercial,
                        'business_name', e.razon_social,
                        'ruc', e.ruc,
                        'address', e.direccion,
                        'parish_id', e.parroquia_id,
                        'country', e.pais,
                        'client_id', e.cliente_id,
                        'phones', cc.phones,
                        'emails', cc.correos
                    )
                ELSE NULL
            END AS company,

            -- Person Data (Ciudadano)
            CASE
                WHEN ci.ciudadano_id IS NOT NULL THEN
                    jsonb_build_object(
                        'person_id', ci.ciudadano_id,
                        'first_name', ci.nombres,
                        'last_name', ci.apellidos,
                        'birth_date', ci.fecha_nacimiento,
                        'is_deceased', ci.fallecido,
                        'gender_id', ci.sexo_id,
                        'civil_status_id', ci.estado_civil_id,
                        'profession_id', ci.profesion_id,
                        'parish_id', ci.parroquia_id,
                        'address', ci.direccion,
                        'country', ci.pais_origen,
                        'phones', cc.phones,
                        'emails', cc.correos
                    )
                ELSE NULL
            END AS person

        FROM acometidas.solicitud s
        LEFT JOIN public.usuarios a ON a.usuario_id = s.id_analista
        LEFT JOIN acometidas.documento_adjunto d
            ON d.id_solicitud = s.id_solicitud
           AND d.is_deleted = FALSE
        LEFT JOIN acometidas.factura_inspeccion f
            ON f.id_solicitud = s.id_solicitud
        LEFT JOIN acometidas.informe_inspeccion i
            ON i.id_solicitud = s.id_solicitud
           AND i.is_deleted = FALSE
        LEFT JOIN acometidas.contrato_servicio c
            ON c.id_solicitud = s.id_solicitud
           AND c.is_deleted = FALSE
        LEFT JOIN acometidas.registro_catastral r
            ON r.id_solicitud = s.id_solicitud
           AND r.is_deleted = FALSE
        LEFT JOIN public.cliente_usuario cu ON cu.cliente_id = s.id_cliente
        LEFT JOIN ciudadano ci ON ci.ciudadano_id = cu.cliente_id
        LEFT JOIN empresa e ON e.ruc = cu.cliente_id
        LEFT JOIN cliente_contacto cc ON cc.cliente_id = cu.cliente_id

        WHERE (s.numero_solicitud::text = $1 OR s.id_solicitud::text = $1)
          AND s.is_deleted = FALSE

        GROUP BY
            s.id_solicitud,
            a.username,
            f.id_factura,
            i.id_informe,
            c.id_contrato,
            r.id_registro,
            person,
            company;`,
        [requestNumberOrId],
      );

    if (result.length === 0) return null;
    return RequestAdapter.toRequestDetailByClientResponseFromSqlResult(
      result[0],
    );
  }

  async getHistorialBySolicitudId(
    solicitudId: string,
  ): Promise<HistorialEstadoResponse[]> {
    const result = await this.databaseSService.query<HistorialEstadoSqlResult>(
      `SELECT
          h.estado_anterior, h.estado_nuevo, h.comentario,
          h.fecha_cambio, u.username AS realizado_por
        FROM acometidas.historial_estado h
        LEFT JOIN public.usuarios u ON u.usuario_id = h.id_usuario_accion
        WHERE h.id_solicitud = $1
        ORDER BY h.fecha_cambio ASC`,
      [solicitudId],
    );
    return result.map(RequestAdapter.toHistorialEstadoResponseFromSqlResult);
  }

  async getExpedientesByClienteId(
    clienteId: string,
  ): Promise<ExpedienteResponse[]> {
    const result = await this.databaseSService.query<ExpedienteSqlResult>(
      `
        SELECT
            -- Datos básicos de la solicitud
            s.id_solicitud AS solicitud_id,
            s.numero_solicitud AS solicitud_numero,
            s.estado,
            s.tipo_persona,
            s.tipo_acometida,
            s.uso_predio,
            s.direccion,
            s.clave_catastral,
            ST_AsText(s.geom) AS coordenadas,
            s.datos_adicionales,
            s.created_at AS fecha_solicitud,
            s.updated_at,
            EXTRACT(DAY FROM (NOW() - s.created_at))::INT AS dias_en_proceso,
            s.id_cliente AS cliente_id,
            
            -- Analista asignado
            a.username AS analista_username,
            
            -- Documentos agrupados como JSON array
            COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                    'id', d.id_documento,
                    'tipodocumento', d.id_tipo_documento,
                    'url', d.url_archivo,
                    'estadoValidacion', d.estado_validacion,
                    'observacion', d.observacion
                )) FILTER (WHERE d.id_documento IS NOT NULL), 
                '[]'
            ) AS documentos,
            
            -- Detalle de Factura
            f.id_factura,
            f.numero_factura,
            f.monto AS monto_factura,
            f.estado AS estado_pago,
            f.fecha_vencimiento,
            f.fecha_pago,
            f.metodo_pago,
            
            -- Detalle del Informe de Inspección
            i.id_informe,
            i.resultado AS resultado_informe,
            i.costo_materiales,
            i.costo_mano_obra,
            i.costo_total,
            i.aprobado AS informe_aprobado,
            i.motivo_rechazo,
            
            -- Detalle del Contrato
            c.id_contrato,
            c.numero_contrato AS numero_contrato,
            c.estado_firma,
            c.valor_total,
            c.url_contrato_firmado,
            
            -- Detalle del Registro Catastral final
            r.numero_cuenta,
            r.numero_medidor,
            r.activo AS servicio_activo,
            r.fecha_activacion
            
        FROM acometidas.solicitud s
        LEFT JOIN public.usuarios a 
            ON a.usuario_id = s.id_analista
        LEFT JOIN acometidas.documento_adjunto d 
            ON d.id_solicitud = s.id_solicitud 
          AND d.is_deleted = FALSE
        LEFT JOIN acometidas.factura_inspeccion f 
            ON f.id_solicitud = s.id_solicitud
        LEFT JOIN acometidas.informe_inspeccion i 
            ON i.id_solicitud = s.id_solicitud 
          AND i.is_deleted = FALSE
        LEFT JOIN acometidas.contrato_servicio c 
            ON c.id_solicitud = s.id_solicitud 
          AND c.is_deleted = FALSE
        LEFT JOIN acometidas.registro_catastral r 
            ON r.id_solicitud = s.id_solicitud 
          AND r.is_deleted = FALSE
        LEFT JOIN public.cliente_usuario cu 
            ON cu.cliente_id = s.id_cliente
            
        WHERE (s.id_cliente = $1 OR cu.cliente_usuario_id::text = $1)
          AND s.is_deleted = FALSE
          
        GROUP BY 
            s.id_solicitud, 
            a.username, 
            f.id_factura, 
            i.id_informe, 
            c.id_contrato, 
            r.id_registro;
      `,
      [clienteId],
    );
    if (result.length === 0) return [];
    return result.map(RequestAdapter.toExpedienteResponseFromSqlResult);
  }

  async getExpedientesByAnalistaId(
    analistaId: string,
  ): Promise<ExpedienteResponse[]> {
    const result = await this.databaseSService.query<ExpedienteSqlResult>(
      `
        SELECT
            -- Datos básicos de la solicitud
            s.id_solicitud AS solicitud_id,
            s.numero_solicitud AS solicitud_numero,
            s.estado,
            s.tipo_persona,
            s.tipo_acometida,
            s.uso_predio,
            s.direccion,
            s.clave_catastral,
            ST_AsText(s.geom) AS coordenadas,
            s.datos_adicionales,
            s.created_at AS fecha_solicitud,
            s.updated_at,
            EXTRACT(DAY FROM (NOW() - s.created_at))::INT AS dias_en_proceso,
            s.id_cliente AS cliente_id,
            
            -- Analista asignado
            a.username AS analista_username,
            
            -- Documentos agrupados como JSON array
            COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                    'id', d.id_documento,
                    'tipodocumento', d.id_tipo_documento,
                    'url', d.url_archivo,
                    'estadoValidacion', d.estado_validacion,
                    'observacion', d.observacion
                )) FILTER (WHERE d.id_documento IS NOT NULL), 
                '[]'
            ) AS documentos,
            
            -- Detalle de Factura
            f.id_factura,
            f.numero_factura,
            f.monto AS monto_factura,
            f.estado AS estado_pago,
            f.fecha_vencimiento,
            f.fecha_pago,
            f.metodo_pago,
            
            -- Detalle del Informe de Inspección
            i.id_informe,
            i.resultado AS resultado_informe,
            i.costo_materiales,
            i.costo_mano_obra,
            i.costo_total,
            i.aprobado AS informe_aprobado,
            i.motivo_rechazo,
            
            -- Detalle del Contrato
            c.id_contrato,
            c.numero_contrato AS numero_contrato,
            c.estado_firma,
            c.valor_total,
            c.url_contrato_firmado,
            
            -- Detalle del Registro Catastral final
            r.numero_cuenta,
            r.numero_medidor,
            r.activo AS servicio_activo,
            r.fecha_activacion
            
        FROM acometidas.solicitud s
        LEFT JOIN public.usuarios a 
            ON a.usuario_id = s.id_analista
        LEFT JOIN acometidas.documento_adjunto d 
            ON d.id_solicitud = s.id_solicitud 
          AND d.is_deleted = FALSE
        LEFT JOIN acometidas.factura_inspeccion f 
            ON f.id_solicitud = s.id_solicitud
        LEFT JOIN acometidas.informe_inspeccion i 
            ON i.id_solicitud = s.id_solicitud 
          AND i.is_deleted = FALSE
        LEFT JOIN acometidas.contrato_servicio c 
            ON c.id_solicitud = s.id_solicitud 
          AND c.is_deleted = FALSE
        LEFT JOIN acometidas.registro_catastral r 
            ON r.id_solicitud = s.id_solicitud 
          AND r.is_deleted = FALSE
        LEFT JOIN public.cliente_usuario cu 
            ON cu.cliente_id = s.id_cliente
            
        WHERE (s.id_analista::text = $1 OR a.usuario_id::text = $1)
          AND s.is_deleted = FALSE
          
        GROUP BY 
            s.id_solicitud, 
            a.username, 
            f.id_factura, 
            i.id_informe, 
            c.id_contrato, 
            r.id_registro;
      `,
      [analistaId],
    );
    if (result.length === 0) return [];
    return result.map(RequestAdapter.toExpedienteResponseFromSqlResult);
  }

  async getDashboardKpis(): Promise<DashboardKpisResponse> {
    const result = await this.databaseSService.query<DashboardKpisSqlResult>(
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
    return RequestAdapter.toDashboardKpisResponseFromSqlResult(result[0]);
  }

  async getOrdenesTrabajoBysSolicitudId(
    solicitudId: string,
  ): Promise<SolicitudOrdenTrabajoResponse[]> {
    const result =
      await this.databaseSService.query<SolicitudOrdenTrabajoSqlResult>(
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
    return result.map(
      RequestAdapter.toSolicitudOrdenTrabajoResponseFromSqlResult,
    );
  }

  // ── Mapa de estado → fase del wizard ────────────────────────────────────────

  private static readonly STEP_MAP: Record<
    string,
    { step: string; index: number }
  > = {
    DRAFT: { step: 'solicitud', index: 0 },
    DOCS_SUBMITTED: { step: 'documentos', index: 1 },
    DOCS_REJECTED: { step: 'documentos', index: 1 },
    DOCS_APPROVED: { step: 'documentos', index: 1 },
    FACTURA_INSPECCION_EMITIDA: { step: 'pago', index: 2 },
    PAGO_PENDIENTE: { step: 'pago', index: 2 },
    PAGO_CONFIRMADO: { step: 'pago', index: 2 },
    ORDEN_INSPECCION_EMITIDA: { step: 'inspeccion', index: 3 },
    INSPECCION_EN_PROCESO: { step: 'inspeccion', index: 3 },
    INFORME_EN_REVISION: { step: 'inspeccion', index: 3 },
    INFORME_APROBADO: { step: 'inspeccion', index: 3 },
    RECHAZADA_TECNICA: { step: 'rechazada', index: -1 },
    CONTRATO_GENERADO: { step: 'contrato', index: 4 },
    CONTRATO_FIRMADO: { step: 'contrato', index: 4 },
    OT_INSTALACION_EMITIDA: { step: 'instalacion', index: 5 },
    INSTALACION_EN_PROCESO: { step: 'instalacion', index: 5 },
    INSTALACION_FALLIDA: { step: 'instalacion', index: 5 },
    INSTALACION_COMPLETADA: { step: 'instalacion', index: 5 },
    REGISTRO_CATASTRAL_PENDIENTE: { step: 'catastro', index: 6 },
    SUMINISTRO_ACTIVO: { step: 'completado', index: 6 },
    ANULADA: { step: 'anulada', index: -1 },
  };

  async getTrackingByClienteId(
    clienteId: string,
  ): Promise<TrackingSolicitudResponse[]> {
    // ── Query principal de tracking ────────────────────────────────────────────
    const rows = await this.databaseSService.query<TrackingSolicitudSqlResult>(
      `SELECT
          -- Identificación
          s.id_solicitud,
          COALESCE(s.numero_solicitud, 'SOL-EPAA-' ||
              TO_CHAR(s.created_at, 'YYYY') || '-' ||
              LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::TEXT, 7, '0')
          )                                                       AS numero_solicitud,
          s.tipo_acometida,
          s.uso_predio,
          s.direccion,
          s.clave_catastral,

          -- Fecha creación en español
          LPAD(EXTRACT(DAY FROM s.created_at)::TEXT, 2, '0') ||
          ' de ' ||
          CASE EXTRACT(MONTH FROM s.created_at)
              WHEN 1  THEN 'enero'      WHEN 2  THEN 'febrero'  WHEN 3  THEN 'marzo'
              WHEN 4  THEN 'abril'      WHEN 5  THEN 'mayo'     WHEN 6  THEN 'junio'
              WHEN 7  THEN 'julio'      WHEN 8  THEN 'agosto'   WHEN 9  THEN 'septiembre'
              WHEN 10 THEN 'octubre'    WHEN 11 THEN 'noviembre' WHEN 12 THEN 'diciembre'
          END ||
          ', ' || EXTRACT(YEAR FROM s.created_at)::TEXT          AS fecha_creacion,

          -- Estado actual
          s.estado                                                AS estado_codigo,
          ces.nombre                                              AS estado_actual_label,

          -- Métricas
          EXTRACT(DAY FROM (NOW() - s.created_at))::INT          AS dias_en_proceso,

          -- Último movimiento
          (SELECT h.fecha_cambio
           FROM acometidas.historial_estado h
           WHERE h.id_solicitud = s.id_solicitud
           ORDER BY h.fecha_cambio DESC LIMIT 1)                 AS ultimo_movimiento,
          (SELECT h.comentario
           FROM acometidas.historial_estado h
           WHERE h.id_solicitud = s.id_solicitud
           ORDER BY h.fecha_cambio DESC LIMIT 1)                 AS ultimo_comentario,

          -- Documentos
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud AND d.is_deleted = FALSE
          )::INT                                                  AS docs_total,
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud
             AND d.estado_validacion = 'VALIDO' AND d.is_deleted = FALSE
          )::INT                                                  AS docs_aprobados,
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud
             AND d.estado_validacion = 'INVALIDO' AND d.is_deleted = FALSE
          )::INT                                                  AS docs_rechazados,

          -- Factura
          fi.numero_factura,
          fi.monto                                                AS monto_inspeccion,
          fi.estado                                               AS estado_pago,
          fi.fecha_vencimiento,
          fi.fecha_pago,
          fi.metodo_pago,

          -- Inspección (via orden de trabajo)
          ii.resultado                                            AS resultado_inspeccion,
          ii.distancia_red_m,
          ii.costo_total                                          AS costo_estimado,
          ii.aprobado                                             AS informe_aprobado,
          ii.observaciones                                        AS obs_inspeccion,

          -- Contrato
          cs.numero_contrato,
          cs.valor_total                                          AS valor_contrato,
          cs.estado_firma,
          cs.fecha_firma_usuario,
          cs.fecha_firma_epaa,

          -- Instalación / Catastro
          rc.numero_medidor,
          rc.numero_cuenta,
          rc.activo                                               AS servicio_activo,
          rc.fecha_activacion,

          -- Analista
          u.username                                              AS analista,

          -- Timeline (JSON ordenado)
          (SELECT jsonb_agg(
              jsonb_build_object(
                  'estado',         h.estado_nuevo,
                  'estadoLabel',    ces2.nombre,
                  'estadoAnterior', h.estado_anterior,
                  'fecha',          h.fecha_cambio,
                  'comentario',     h.comentario
              ) ORDER BY h.fecha_cambio
           )
           FROM acometidas.historial_estado h
           JOIN acometidas.cat_estado_solicitud ces2 ON ces2.codigo = h.estado_nuevo
           WHERE h.id_solicitud = s.id_solicitud
          )                                                       AS historial,

          s.created_at,
          s.updated_at

      FROM acometidas.solicitud s
      JOIN acometidas.cat_estado_solicitud  ces ON ces.codigo = s.estado
      LEFT JOIN public.usuarios             u   ON u.usuario_id   = s.id_analista
      LEFT JOIN acometidas.factura_inspeccion fi ON fi.id_solicitud = s.id_solicitud
      -- Informe: via orden de trabajo tipo INSPECCION
      LEFT JOIN acometidas.solicitud_orden_trabajo sot
             ON sot.id_solicitud = s.id_solicitud
            AND sot.tipo_orden   = 'INSPECCION'
      LEFT JOIN acometidas.informe_inspeccion ii
             ON ii.id_orden_trabajo = sot.id_orden_trabajo
            AND ii.is_deleted = FALSE
      LEFT JOIN acometidas.contrato_servicio cs
             ON cs.id_solicitud = s.id_solicitud
            AND cs.is_deleted   = FALSE
      LEFT JOIN acometidas.registro_catastral rc
             ON rc.id_solicitud = s.id_solicitud
            AND rc.is_deleted   = FALSE
      LEFT JOIN public.cliente_usuario cu ON cu.cliente_id = s.id_cliente
      WHERE (s.id_cliente = $1 OR cu.cliente_usuario_id::text = $1)
        AND s.is_deleted = FALSE
      ORDER BY s.created_at DESC`,
      [clienteId],
    );

    return rows.map((row): TrackingSolicitudResponse => {
      const phaseInfo = RequestPostgreSQLPersistence.STEP_MAP[
        row.estado_codigo
      ] ?? { step: 'solicitud', index: 0 };
      return RequestAdapter.toTrackingSolicitudResponseFromSqlResult(
        row,
        phaseInfo,
      );
    });
  }

  async getTrackingByAnalistaId(
    analistaId: string,
  ): Promise<TrackingSolicitudResponse[]> {
    // Reutilizar lógica de tracking por cliente, filtrando por analista en la consulta principal
    const rows = await this.databaseSService.query<TrackingSolicitudSqlResult>(
      `SELECT
          -- Identificación
          s.id_solicitud,
          COALESCE(s.numero_solicitud, 'SOL-EPAA-' ||
              TO_CHAR(s.created_at, 'YYYY') || '-' ||
              LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::TEXT, 7, '0')
          )                                                       AS numero_solicitud,
          s.tipo_acometida,
          s.uso_predio,
          s.direccion,
          s.clave_catastral,

          -- Fecha creación en español
          LPAD(EXTRACT(DAY FROM s.created_at)::TEXT, 2, '0') ||
          ' de ' ||
          CASE EXTRACT(MONTH FROM s.created_at)
              WHEN 1  THEN 'enero'      WHEN 2  THEN 'febrero'  WHEN 3  THEN 'marzo'
              WHEN 4  THEN 'abril'      WHEN 5  THEN 'mayo'     WHEN 6  THEN 'junio'
              WHEN 7  THEN 'julio'      WHEN 8  THEN 'agosto'   WHEN 9  THEN 'septiembre'
              WHEN 10 THEN 'octubre'    WHEN 11 THEN 'noviembre' WHEN 12 THEN 'diciembre'
          END ||
          ', ' || EXTRACT(YEAR FROM s.created_at)::TEXT          AS fecha_creacion,

          -- Estado actual
          s.estado                                                AS estado_codigo,
          ces.nombre                                              AS estado_actual_label,

          -- Métricas
          EXTRACT(DAY FROM (NOW() - s.created_at))::INT          AS dias_en_proceso,

          -- Último movimiento
          (SELECT h.fecha_cambio
           FROM acometidas.historial_estado h
           WHERE h.id_solicitud = s.id_solicitud
           ORDER BY h.fecha_cambio DESC LIMIT 1)                 AS ultimo_movimiento,
          (SELECT h.comentario
           FROM acometidas.historial_estado h
           WHERE h.id_solicitud = s.id_solicitud
           ORDER BY h.fecha_cambio DESC LIMIT 1)                 AS ultimo_comentario,

          -- Documentos
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud AND d.is_deleted = FALSE
          )::INT                                                  AS docs_total,
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud
             AND d.estado_validacion = 'VALIDO' AND d.is_deleted = FALSE
          )::INT                                                  AS docs_aprobados,
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud
             AND d.estado_validacion = 'INVALIDO' AND d.is_deleted = FALSE
          )::INT                                                  AS docs_rechazados,

          -- Factura
          fi.numero_factura,
          fi.monto                                                AS monto_inspeccion,
          fi.estado                                               AS estado_pago,
          fi.fecha_vencimiento,
          fi.fecha_pago,
          fi.metodo_pago,

          -- Inspección (via orden de trabajo tipo INSPECCION)
          ii.resultado                                            AS resultado_inspeccion,
          ii.distancia_red_m,
          ii.costo_total                                          AS costo_estimado,
          ii.aprobado                                             AS informe_aprobado,
          ii.observaciones                                        AS obs_inspeccion,

          -- Contrato
          cs.numero_contrato,
          cs.valor_total                                          AS valor_contrato,
          cs.estado_firma,
          cs.fecha_firma_usuario,
          cs.fecha_firma_epaa,

          -- Instalación / Catastro
          rc.numero_medidor,
          rc.numero_cuenta,
          rc.activo                                               AS servicio_activo,
          rc.fecha_activacion,

          -- Analista
          u.username                                              AS analista,

          -- Timeline (JSON ordenado)
          (SELECT jsonb_agg(
              jsonb_build_object(
                  'estado',         h.estado_nuevo,
                  'estadoLabel',    ces2.nombre,
                  'estadoAnterior', h.estado_anterior,
                  'fecha',          h.fecha_cambio,
                  'comentario',     h.comentario
              ) ORDER BY h.fecha_cambio
           )
           FROM acometidas.historial_estado h
           JOIN acometidas.cat_estado_solicitud ces2 ON ces2.codigo = h.estado_nuevo
           WHERE h.id_solicitud = s.id_solicitud
          )                                                       AS historial,

          s.created_at,
          s.updated_at

      FROM acometidas.solicitud s
      JOIN acometidas.cat_estado_solicitud  ces ON ces.codigo = s.estado
      LEFT JOIN public.usuarios             u   ON u.usuario_id   = s.id_analista
      LEFT JOIN acometidas.factura_inspeccion fi ON fi.id_solicitud = s.id_solicitud
      -- Informe: via orden de trabajo tipo INSPECCION
      LEFT JOIN acometidas.solicitud_orden_trabajo sot
             ON sot.id_solicitud = s.id_solicitud
            AND sot.tipo_orden   = 'INSPECCION'
      LEFT JOIN acometidas.informe_inspeccion ii
             ON ii.id_orden_trabajo = sot.id_orden_trabajo
            AND ii.is_deleted = FALSE
      LEFT JOIN acometidas.contrato_servicio cs
             ON cs.id_solicitud = s.id_solicitud
            AND cs.is_deleted   = FALSE
      LEFT JOIN acometidas.registro_catastral rc
             ON rc.id_solicitud = s.id_solicitud
            AND rc.is_deleted   = FALSE
      LEFT JOIN public.cliente_usuario cu ON cu.cliente_id = s.id_cliente
      WHERE (s.id_analista::text = $1 OR u.usuario_id::text = $1)
        AND s.is_deleted = FALSE
      ORDER BY s.created_at DESC`,
      [analistaId],
    );

    // Reutilizar lógica de mapeo a TrackingSolicitudResponse
    return rows.map((row): TrackingSolicitudResponse => {
      const phaseInfo = RequestPostgreSQLPersistence.STEP_MAP[
        row.estado_codigo
      ] ?? { step: 'solicitud', index: 0 };
      return RequestAdapter.toTrackingSolicitudResponseFromSqlResult(
        row,
        phaseInfo,
      );
    });
  }

  async getTrackingBySolicitudId(
    solicitudId: string,
  ): Promise<TrackingSolicitudResponse | null> {
    const result =
      await this.databaseSService.query<TrackingSolicitudSqlResult>(
        `SELECT
          -- Identificación
          s.id_solicitud,
          COALESCE(s.numero_solicitud, 'SOL-EPAA-' ||
              TO_CHAR(s.created_at, 'YYYY') || '-' ||
              LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::TEXT, 7, '0')
          )                                                       AS numero_solicitud,
          s.tipo_acometida,
          s.uso_predio,
          s.direccion,
          s.clave_catastral,

          -- Fecha creación en español
          LPAD(EXTRACT(DAY FROM s.created_at)::TEXT, 2, '0') ||
          ' de ' ||
          CASE EXTRACT(MONTH FROM s.created_at)
              WHEN 1  THEN 'enero'      WHEN 2  THEN 'febrero'  WHEN 3  THEN 'marzo'
              WHEN 4  THEN 'abril'      WHEN 5  THEN 'mayo'     WHEN 6  THEN 'junio'
              WHEN 7  THEN 'julio'      WHEN 8  THEN 'agosto'   WHEN 9  THEN 'septiembre'
              WHEN 10 THEN 'octubre'    WHEN 11 THEN 'noviembre' WHEN 12 THEN 'diciembre'
          END ||
          ', ' || EXTRACT(YEAR FROM s.created_at)::TEXT          AS fecha_creacion,

          -- Estado actual
          s.estado                                                AS estado_codigo,
          ces.nombre                                              AS estado_actual_label,

          -- Métricas
          EXTRACT(DAY FROM (NOW() - s.created_at))::INT          AS dias_en_proceso,

          -- Último movimiento
          (SELECT h.fecha_cambio
           FROM acometidas.historial_estado h
           WHERE h.id_solicitud = s.id_solicitud
           ORDER BY h.fecha_cambio DESC LIMIT 1)                 AS ultimo_movimiento,
          (SELECT h.comentario
           FROM acometidas.historial_estado h
           WHERE h.id_solicitud = s.id_solicitud
           ORDER BY h.fecha_cambio DESC LIMIT 1)                 AS ultimo_comentario,

          -- Documentos
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud AND d.is_deleted = FALSE
          )::INT                                                  AS docs_total,
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud
             AND d.estado_validacion = 'VALIDO' AND d.is_deleted = FALSE
          )::INT                                                  AS docs_aprobados,
          (SELECT COUNT(*) FROM acometidas.documento_adjunto d
           WHERE d.id_solicitud = s.id_solicitud
             AND d.estado_validacion = 'INVALIDO' AND d.is_deleted = FALSE
          )::INT                                                  AS docs_rechazados,

          -- Factura
          fi.numero_factura,
          fi.monto                                                AS monto_inspeccion,
          fi.estado                                               AS estado_pago,
          fi.fecha_vencimiento,
          fi.fecha_pago,
          fi.metodo_pago,

          -- Inspección (via orden de trabajo tipo INSPECCION)
          ii.resultado                                            AS resultado_inspeccion,
          ii.distancia_red_m,
          ii.costo_total                                          AS costo_estimado,
          ii.aprobado                                             AS informe_aprobado,
          ii.observaciones                                        AS obs_inspeccion,

          -- Contrato
          cs.numero_contrato,
          cs.valor_total                                          AS valor_contrato,
          cs.estado_firma,
          cs.fecha_firma_usuario,
          cs.fecha_firma_epaa,

          -- Instalación / Catastro
          rc.numero_medidor,
          rc.numero_cuenta,
          rc.activo                                               AS servicio_activo,
          rc.fecha_activacion,

          -- Analista
          u.username                                              AS analista,

          -- Timeline (JSON ordenado)
          (SELECT jsonb_agg(
              jsonb_build_object(
                  'estado',         h.estado_nuevo,
                  'estadoLabel',    ces2.nombre,
                  'estadoAnterior', h.estado_anterior,
                  'fecha',          h.fecha_cambio,
                  'comentario',     h.comentario
              ) ORDER BY h.fecha_cambio
           )
           FROM acometidas.historial_estado h
           JOIN acometidas.cat_estado_solicitud ces2 ON ces2.codigo = h.estado_nuevo
           WHERE h.id_solicitud = s.id_solicitud
          )                                                       AS historial,

          s.created_at,
          s.updated_at

      FROM acometidas.solicitud s
      JOIN acometidas.cat_estado_solicitud  ces ON ces.codigo = s.estado
      LEFT JOIN public.usuarios             u   ON u.usuario_id   = s.id_analista
      LEFT JOIN acometidas.factura_inspeccion fi ON fi.id_solicitud = s.id_solicitud
      -- Informe: via orden de trabajo tipo INSPECCION
      LEFT JOIN acometidas.solicitud_orden_trabajo sot
             ON sot.id_solicitud = s.id_solicitud
            AND sot.tipo_orden   = 'INSPECCION'
      LEFT JOIN acometidas.informe_inspeccion ii
             ON ii.id_orden_trabajo = sot.id_orden_trabajo
            AND ii.is_deleted = FALSE
      LEFT JOIN acometidas.contrato_servicio cs
             ON cs.id_solicitud = s.id_solicitud
            AND cs.is_deleted   = FALSE
      LEFT JOIN acometidas.registro_catastral rc
             ON rc.id_solicitud = s.id_solicitud
            AND rc.is_deleted   = FALSE
      LEFT JOIN public.cliente_usuario cu ON cu.cliente_id = s.id_cliente
      WHERE s.id_solicitud = $1
        AND s.is_deleted = FALSE`,
        [solicitudId],
      );

    if (result.length === 0) return null;

    // Reutilizar lógica de mapeo a TrackingSolicitudResponse (tomando el primer resultado)
    const row = result[0];
    const phaseInfo = RequestPostgreSQLPersistence.STEP_MAP[
      row.estado_codigo
    ] ?? { step: 'solicitud', index: 0 };
    return RequestAdapter.toTrackingSolicitudResponseFromSqlResult(
      row,
      phaseInfo,
    );
  }
}
