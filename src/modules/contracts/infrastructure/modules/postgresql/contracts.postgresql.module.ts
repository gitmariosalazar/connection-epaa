import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';
import { ContractsController } from '../../controllers/contracts.controller';
import { GenerateContractUseCase, SignContractUseCase } from '../../../application/usecases/ContractUseCases';
import { ContractsPostgreSQLPersistence } from '../../repositories/postgresql/persistence/contracts.postgresql.persistence';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],
  controllers: [ContractsController],
  providers: [
    GenerateContractUseCase,
    SignContractUseCase,
    {
      provide: 'InterfaceContractsRepository',
      useClass: ContractsPostgreSQLPersistence,
    },
  ],
})
export class ContractsPostgreSQLModule {}
