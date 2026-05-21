import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { CadastralController } from '../../controllers/cadastral.controller';
import { RegisterCadastralAndActivateUseCase } from '../../../application/usecases/RegisterCadastralAndActivateUseCase';
import { CadastralPostgreSQLPersistence } from '../../repositories/postgresql/persistence/cadastral.postgresql.persistence';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],
  controllers: [CadastralController],
  providers: [
    RegisterCadastralAndActivateUseCase,
    {
      provide: 'InterfaceCadastralRepository',
      useClass: CadastralPostgreSQLPersistence,
    },
  ],
})
export class CadastralPostgreSQLModule {}
