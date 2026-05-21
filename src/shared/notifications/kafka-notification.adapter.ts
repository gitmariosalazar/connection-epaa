import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, ClientKafka, Transport } from '@nestjs/microservices';
import { INotificationPort } from './notification.port';
import { environments } from '../../settings/environments/environments';

/**
 * KafkaNotificationAdapter — Adaptador de salida (OCP, DIP).
 * Cubre los 11 puntos de notificación del proceso BPMN de Acometidas.
 *
 * FIRE-AND-FORGET: usa .emit() (no .send()).
 *   → El flujo principal NUNCA se bloquea ni falla por notificaciones.
 *   → Si Kafka no está disponible, el error se loguea y se continúa.
 */
@Injectable()
export class KafkaNotificationAdapter implements INotificationPort, OnModuleInit {
  private readonly logger = new Logger(KafkaNotificationAdapter.name);

  @Client({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'connection-notifier-client',
        brokers: [environments.KAFKA_BROKER_URL],
        retry: { retries: 3, initialRetryTime: 300 },
      },
      producer: {
        allowAutoTopicCreation: true,
      },
    },
  })
  private kafkaClient: ClientKafka;

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('KafkaNotificationAdapter conectado al broker para notificaciones');
    } catch (err) {
      this.logger.warn(
        `KafkaNotificationAdapter no pudo conectar al arrancar (${err.message}). ` +
        `Las notificaciones se enviarán cuando el broker esté disponible.`,
      );
    }
  }

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

  /** Nueva solicitud con documentos enviada → alerta al analista */
  notifyDocsSubmitted(userId: string, solicitudId: string, numDocumentos: number): void {
    this.emit('notifications.acometidas.docs_submitted', { userId, solicitudId, numDocumentos });
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
