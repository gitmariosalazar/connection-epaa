import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { DocumentValidationController } from '../../controllers/document-validation.controller';
import { ValidateDocumentsUseCase } from '../../../application/usecases/ValidateDocumentsUseCase';
import { DocumentValidationPostgreSQLPersistence } from '../../repositories/postgresql/persistence/document-validation.postgresql.persistence';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],
  controllers: [DocumentValidationController],
  providers: [
    ValidateDocumentsUseCase,
    {
      provide: 'InterfaceDocumentValidationRepository',
      useClass: DocumentValidationPostgreSQLPersistence,
    },
  ],
})
export class DocumentValidationPostgreSQLModule {}
