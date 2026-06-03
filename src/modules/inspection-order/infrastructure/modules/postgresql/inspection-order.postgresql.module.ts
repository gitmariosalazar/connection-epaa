import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';
import { InspectionOrderController } from '../../controllers/inspection-order.controller';
import { IssueInspectionOrderUseCase, StartInspectionUseCase } from '../../../application/usecases/InspectionOrderUseCases';
import { InspectionOrderPostgreSQLPersistence } from '../../repositories/postgresql/persistence/inspection-order.postgresql.persistence';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],
  controllers: [InspectionOrderController],
  providers: [
    IssueInspectionOrderUseCase,
    StartInspectionUseCase,
    {
      provide: 'InterfaceInspectionOrderRepository',
      useClass: InspectionOrderPostgreSQLPersistence,
    },
  ],
})
export class InspectionOrderPostgreSQLModule {}
