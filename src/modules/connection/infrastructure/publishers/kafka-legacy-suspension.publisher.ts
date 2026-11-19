import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  ILegacySuspensionEventPublisher,
  LegacySuspensionPayload,
} from '../../domain/contracts/legacy-suspension-event.publisher.interface';
import { environments } from '../../../../settings/environments/environments';

@Injectable()
export class KafkaLegacySuspensionPublisher implements ILegacySuspensionEventPublisher {
  private readonly logger: Logger = new Logger(
    KafkaLegacySuspensionPublisher.name,
  );

  constructor(
    @Inject(environments.CONNECTION_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  publishSuspensionToLegacy(payload: LegacySuspensionPayload): void {
    try {
      this.logger.log(
        `📢 [EVENT -> KAFKA] Disparando suspensión a epaa-legacy | Sector: ${payload.sector} | Cuenta: ${payload.account}`,
      );

      // Enviamos directamente al topic 'epaa_database_legacy_topic'
      this.kafkaClient.emit('epaa_database_legacy_topic', {
        pattern: 'epaa-legacy.reading.disable-connection',
        data: {
          sector: payload.sector,
          account: payload.account,
          description: payload.description,
          state: payload.state,
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Error al emitir suspensión a Kafka: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
