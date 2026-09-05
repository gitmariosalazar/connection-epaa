import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { IMeterEventPublisher, MeterChangedEventPayload } from '../../domain/contracts/meter-event.publisher.interface';
import { environments } from '../../../../settings/environments/environments';

@Injectable()
export class KafkaMeterEventPublisher implements IMeterEventPublisher {
  constructor(
    @Inject(environments.CONNECTION_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  publishMeterChangedEvent(payload: MeterChangedEventPayload): void {
    this.kafkaClient.emit('connection.meter.changed', payload);
  }
}
