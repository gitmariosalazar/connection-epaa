import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  IConnectionSuspendedEventPublisher,
  ConnectionSuspendedEventPayload,
} from '../../domain/contracts/connection-suspended-event.publisher.interface';
import { environments } from '../../../../settings/environments/environments';

@Injectable()
export class KafkaConnectionSuspendedEventPublisher implements IConnectionSuspendedEventPublisher {
  private readonly logger = new Logger(
    KafkaConnectionSuspendedEventPublisher.name,
  );

  constructor(
    @Inject(environments.CONNECTION_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishSuspendedEvent(
    event: ConnectionSuspendedEventPayload,
  ): Promise<void> {
    try {
      // El payload mapeado al formato esperado por epaa-database-legacy
      const legacyPayload = {
        sector: event.data.sector,
        account: event.data.account,
        description: `SUSPENSION SIGEPAA: ${event.data.reason} (Estado: ${event.data.stateName})`,
        cadastralKey: event.data.cadastralKey,
        userId: event.data.userId,
        state: event.data.state,
      };

      this.logger.log(
        `📢 [EVENT -> KAFKA] Emitting 'epaa-legacy.reading.disable-connection' to 'epaa_database_legacy_topic' | Connection: ${event.data.connectionId} | Sector: ${event.data.sector} | Cuenta: ${event.data.account}`,
      );

      // Enviamos el mensaje al topic 'epaa_database_legacy_topic' con el patrón y data que espera epaa-database-legacy
      this.kafkaClient.emit('epaa_database_legacy_topic', {
        pattern: 'epaa-legacy.reading.disable-connection',
        data: legacyPayload,
      });
    } catch (error) {
      this.logger.error(
        `❌ Error emitiendo evento de suspensión a Kafka: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
