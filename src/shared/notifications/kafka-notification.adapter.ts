import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { INotificationPort } from './notification.port';
import { environments } from '../../settings/environments/environments';

/**
 * KafkaNotificationAdapter — Adaptador de salida (OCP, DIP).
 * Cubre los 11 puntos de notificación del proceso BPMN de Acometidas.
 *
 * PATRÓN: Idéntico al resto de microservicios del proyecto.
 *   - El ClientKafka se inyecta vía @Inject() del token registrado en
 *     KafkaServiceModule (ClientsModule.register).
 *   - NO usa @Client() como decorador de propiedad, lo que causaba que
 *     NestJS creara un consumer group adicional (nestjs-group-client)
 *     y generara rebalanceos innecesarios.
 *
 * FIRE-AND-FORGET: usa .emit() (no .send()).
 *   → El flujo principal NUNCA se bloquea ni falla por notificaciones.
 *   → Si Kafka no está disponible, el error se loguea y se continúa.
 */
@Injectable()
export class KafkaNotificationAdapter implements INotificationPort {
  private readonly logger = new Logger(KafkaNotificationAdapter.name);

  constructor(
    @Inject(environments.CONNECTION_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  /** Emite un evento a notifications_topic de forma segura (fire-and-forget) */
  private emit(pattern: string, data: Record<string, unknown>): void {
    try {
      this.kafkaClient.emit('notifications_topic', { pattern, data });
      this.logger.log(`[NOTIFY] ${pattern} → ${JSON.stringify({ solicitudId: data.solicitudId ?? data.userId })}`);
    } catch (err) {
      this.logger.error(`[NOTIFY] Error emitiendo ${pattern}: ${err.message}`);
    }
  }

  // ── Fase 2 ─────────────────────────────────────────────────────────────────

  /**
   * Nueva solicitud con documentos enviada.
   * Emite la notificación correcta según el destinatario:
   *  - SIN clientData → al ANALISTA: alerta operativa (IN_APP únicamente)
   *  - CON clientData → al CLIENTE:  confirmación EMAIL con template HTML profesional
   *
   * Esto evita el doble envío de correo (uno sin template + uno con template).
   */
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
  ): void {
    if (!clientData) {
      // ── Llamada para el ANALISTA: EMAIL con template HTML + IN_APP ─────────
      // El use case del analista consultará el nombre desde la BD automáticamente
      this.emit('notifications.acometidas.docs_submitted', { userId, solicitudId, numDocumentos });
    } else {
      // ── Llamada para el CLIENTE: EMAIL con template HTML + IN_APP ──────────
      this.emit('notifications.acometidas.acometida_confirmacion', {
        userId,
        solicitudId,
        nombre:          clientData.nombre          ?? 'Cliente',
        numeroSolicitud: clientData.numeroSolicitud  ?? solicitudId,
        tipoAcometida:   clientData.tipoAcometida   ?? 'Nueva Acometida de Agua Potable',
        tipoPersona:     clientData.tipoPersona     ?? 'No especificado',
        direccion:       clientData.direccion        ?? 'No especificada',
        claveCatastral:  clientData.claveCatastral  ?? 'No disponible',
        numDocumentos,
      });
    }
  }

  /** Nueva solicitud asignada al analista → EMAIL (template) + IN_APP */
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
  ): void {
    this.emit('notifications.acometidas.docs_submitted', {
      userId:          analistaId,
      solicitudId,
      numDocumentos,
      numeroSolicitud: data.numeroSolicitud,
      tipoAcometida:   data.tipoAcometida,
      tipoPersona:     data.tipoPersona,
      direccion:       data.direccion,
      claveCatastral:  data.claveCatastral,
    });
  }

  // ── Fase 3 ─────────────────────────────────────────────────────────────────

  notifyDocsRechazados(userId: string, solicitudId: string, motivo: string): void {
    this.emit('notifications.acometidas.docs_rechazados', { userId, solicitudId, motivo });
  }

  notifyDocsAprobados(userId: string, solicitudId: string): void {
    this.emit('notifications.acometidas.docs_aprobados', { userId, solicitudId });
  }

  // ── Fase 4 ─────────────────────────────────────────────────────────────────

  notifyInspeccionAsignada(userId: string, solicitudId: string, direccion: string): void {
    this.emit('notifications.acometidas.inspeccion_asignada', { userId, solicitudId, direccion });
  }

  // ── Fase 7 ─────────────────────────────────────────────────────────────────

  notifyOTInstalacionEmitida(userId: string, solicitudId: string, codigoOT: string): void {
    this.emit('notifications.acometidas.ot_instalacion_emitida', { userId, solicitudId, codigoOT });
  }

  // ── Fase 8 ─────────────────────────────────────────────────────────────────

  notifyInformeSubido(userId: string, solicitudId: string): void {
    this.emit('notifications.acometidas.informe_subido', { userId, solicitudId });
  }

  // ── Fase 9 ─────────────────────────────────────────────────────────────────

  notifyInformeAprobado(userId: string, solicitudId: string): void {
    this.emit('notifications.acometidas.informe_aprobado', { userId, solicitudId });
  }

  notifyInformeRechazado(userId: string, solicitudId: string, motivoRechazo: string): void {
    this.emit('notifications.acometidas.informe_rechazado', { userId, solicitudId, motivoRechazo });
  }

  // ── Fase 10 ────────────────────────────────────────────────────────────────

  notifyFacturaEmitida(userId: string, solicitudId: string, monto: number, numerofactura: string): void {
    this.emit('notifications.acometidas.factura_emitida', { userId, solicitudId, monto, numerofactura });
  }

  // ── Fase 11 ────────────────────────────────────────────────────────────────

  notifyPagoConfirmado(userId: string, solicitudId: string): void {
    this.emit('notifications.acometidas.pago_confirmado', { userId, solicitudId });
  }

  // ── Fase 12 ────────────────────────────────────────────────────────────────

  notifyContratoGenerado(userId: string, solicitudId: string, numeroContrato: string): void {
    this.emit('notifications.acometidas.contrato_generado', { userId, solicitudId, numeroContrato });
  }

  // ── Fase 14 ────────────────────────────────────────────────────────────────

  notifySuministroActivo(userId: string, solicitudId: string, numeroCuenta: string, numeroMedidor: string): void {
    this.emit('notifications.acometidas.suministro_activo', { userId, solicitudId, numeroCuenta, numeroMedidor });
  }
}
