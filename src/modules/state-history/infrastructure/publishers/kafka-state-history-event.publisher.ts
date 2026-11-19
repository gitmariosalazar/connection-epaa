import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  IStateHistoryEventPublisher,
  ConnectionStateChangedEventPayload,
} from '../../domain/contracts/state-history-event.publisher.interface';
import { environments } from '../../../../settings/environments/environments';

@Injectable()
export class KafkaStateHistoryEventPublisher implements IStateHistoryEventPublisher {
  private readonly logger: Logger = new Logger(KafkaStateHistoryEventPublisher.name);

  constructor(
    @Inject(environments.CONNECTION_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  publishStateChangedEvent(event: ConnectionStateChangedEventPayload): void {
    try {
      this.logger.log(
        `📢 [DOMAIN-EVENT -> KAFKA] Emitting 'connection.state-changed' on Kafka bus | Event ID: ${event.eventId} | Connection: ${event.data.connectionId} (${event.data.previousState?.name ?? 'INITIAL'} -> ${event.data.newState.name}) | User: ${event.data.userId} | Origin: ${event.data.origin} | Reversal: ${event.data.isReversal}`,
      );
      this.kafkaClient.emit('connection.state-changed', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish connection.state-changed event: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
