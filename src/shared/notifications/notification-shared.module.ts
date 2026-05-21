import { Module } from '@nestjs/common';
import { KafkaNotificationAdapter } from './kafka-notification.adapter';

/**
 * NotificationSharedModule — exporta el adaptador a todos los módulos de acometidas.
 * Al importarlo, cada módulo puede inyectar INotificationPort en sus use cases.
 */
@Module({
  providers: [
    {
      provide: 'INotificationPort',
      useClass: KafkaNotificationAdapter,
    },
  ],
  exports: ['INotificationPort'],
})
export class NotificationSharedModule {}
