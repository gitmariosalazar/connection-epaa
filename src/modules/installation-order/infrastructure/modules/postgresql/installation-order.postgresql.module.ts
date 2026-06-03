import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';
import { InstallationOrderController } from '../../controllers/installation-order.controller';
import {
  IssueInstallationOrderUseCase,
  StartInstallationUseCase,
  CompleteInstallationUseCase,
  FailInstallationUseCase,
} from '../../../application/usecases/InstallationOrderUseCases';
import { InstallationOrderPostgreSQLPersistence } from '../../repositories/postgresql/persistence/installation-order.postgresql.persistence';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],
  controllers: [InstallationOrderController],
  providers: [
    IssueInstallationOrderUseCase,
    StartInstallationUseCase,
    CompleteInstallationUseCase,
    FailInstallationUseCase,
    {
      provide: 'InterfaceInstallationOrderRepository',
      useClass: InstallationOrderPostgreSQLPersistence,
    },
  ],
})
export class InstallationOrderPostgreSQLModule {}
