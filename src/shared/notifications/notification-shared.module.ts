import { Module } from '@nestjs/common';
import { KafkaNotificationAdapter } from './kafka-notification.adapter';
import { KafkaServiceModule } from '../kafka/kafka-service.module';

/**
 * NotificationSharedModule — exporta el adaptador a todos los módulos de acometidas.
 *
 * Importa KafkaServiceModule para que el ClientKafka inyectado en
 * KafkaNotificationAdapter sea el mismo cliente centralizado del proyecto,
 * sin crear grupos de consumidores adicionales (mismo patrón que el resto de MS).
 */
@Module({
  imports: [KafkaServiceModule],
  providers: [
    {
      provide: 'INotificationPort',
      useClass: KafkaNotificationAdapter,
    },
  ],
  exports: ['INotificationPort'],
})
export class NotificationSharedModule {}
