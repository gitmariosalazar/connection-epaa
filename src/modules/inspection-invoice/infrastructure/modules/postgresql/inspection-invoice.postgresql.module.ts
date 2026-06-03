import { Get, Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';
import { InspectionInvoiceController } from '../../controllers/inspection-invoice.controller';
import { CreateInspectionInvoiceUseCase } from '../../../application/usecases/CreateInspectionInvoiceUseCase';
import { UpdateInspectionInvoiceUseCase } from '../../../application/usecases/UpdateInspectionInvoiceUseCase';
import { DeleteInspectionInvoiceUseCase } from '../../../application/usecases/DeleteInspectionInvoiceUseCase';
import { FindAllInspectionInvoicesByRequestIdUseCase } from '../../../application/usecases/FindAllInspectionInvoicesByRequestIdUseCase';
import { FindAllInspectionInvoicesUseCase } from '../../../application/usecases/FindAllInspectionInvoicesUseCase';
import { GetInspectionInvoiceByIdUseCase } from '../../../application/usecases/GetInspectionInvoiceByIdUseCase';
import { InspectionInvoicePostgreSqlPersistence } from '../../repositories/postgresql/persistence/inspection-invoice.postgresql.persistence';
import { UploadFileService } from '../../../../documents/application/services/upload-file.service';
import { LocalFileStorageService } from '../../../../documents/infrastructure/services/storage/local-file-storage.service';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule, NotificationSharedModule],

  controllers: [InspectionInvoiceController],
  providers: [
    CreateInspectionInvoiceUseCase,
    UpdateInspectionInvoiceUseCase,
    GetInspectionInvoiceByIdUseCase,
    FindAllInspectionInvoicesUseCase,
    FindAllInspectionInvoicesByRequestIdUseCase,
    DeleteInspectionInvoiceUseCase,
    UploadFileService,
    {
      provide: 'InterfaceFileStorageService',
      useClass: LocalFileStorageService,
    },
    {
      provide: 'InterfaceInspectionInvoiceRepository',
      useClass: InspectionInvoicePostgreSqlPersistence,
    },
  ],
})
export class InspectionInvoicePostgreSQLModule {}
