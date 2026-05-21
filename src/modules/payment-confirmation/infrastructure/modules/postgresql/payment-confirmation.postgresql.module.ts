import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';
import { PaymentConfirmationController } from '../../controllers/payment-confirmation.controller';
import { ConfirmPaymentUseCase } from '../../../application/usecases/ConfirmPaymentUseCase';
import { PaymentConfirmationPostgreSQLPersistence } from '../../repositories/postgresql/persistence/payment-confirmation.postgresql.persistence';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],
  controllers: [PaymentConfirmationController],
  providers: [
    ConfirmPaymentUseCase,
    {
      provide: 'InterfacePaymentConfirmationRepository',
      useClass: PaymentConfirmationPostgreSQLPersistence,
    },
  ],
})
export class PaymentConfirmationPostgreSQLModule {}
