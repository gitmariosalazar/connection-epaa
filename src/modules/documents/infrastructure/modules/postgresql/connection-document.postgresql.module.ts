import { Module } from '@nestjs/common';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { ConnectionDocumentController } from '../../controllers/connection-document.controller';
import { ConnectionDocumentPostgreSQLPersistence } from '../../repositories/postgresql/persistence/connection-document.postgresql.persistence';
import { FindAllConnectionDocumentsByRequestIdUseCase } from '../../../application/usecases/FindAllConnectionDocumentsByRequestIdUseCase';
import { FindAllConnectionDocumentsByClientIdUseCase } from '../../../application/usecases/FindAllConnectionDocumentsByClientIdUseCase';
import { DeleteConnectionDocumentUseCase } from '../../../application/usecases/DeleteConnectionDocumentUseCase';
import { UpdateConnectionDocumentUseCase } from '../../../application/usecases/UpdateConnectionDocumentUseCase';
import { GetConnectionDocumentByIdUseCase } from '../../../application/usecases/GetConnectionDocumentByIdUseCase';
import { FindAllConnectionDocumentsUseCase } from '../../../application/usecases/FindAllConnectionDocumentsUseCase';
import { CreateConnectionDocumentUseCase } from '../../../application/usecases/CreateConnectionDocumentUseCase';
import { UploadFileService } from '../../../application/services/upload-file.service';
import { LocalFileStorageService } from '../../services/storage/local-file-storage.service';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [ConnectionDocumentController],
  providers: [
    CreateConnectionDocumentUseCase,
    FindAllConnectionDocumentsUseCase,
    GetConnectionDocumentByIdUseCase,
    UpdateConnectionDocumentUseCase,
    DeleteConnectionDocumentUseCase,
    FindAllConnectionDocumentsByClientIdUseCase,
    FindAllConnectionDocumentsByRequestIdUseCase,
    UploadFileService,
    {
      provide: 'InterfaceConnectionDocumentRepository',
      useClass: ConnectionDocumentPostgreSQLPersistence,
    },
    {
      provide: 'InterfaceFileStorageService',
      useClass: LocalFileStorageService,
    },
  ],
  exports: [],
})
export class PostgresqlConnectionDocumentModule {}
