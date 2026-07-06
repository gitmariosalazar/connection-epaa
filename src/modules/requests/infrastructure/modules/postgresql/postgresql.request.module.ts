import { Module } from '@nestjs/common';
import { RequestController } from '../../controllers/request.controller';
import { CreateRequestUseCase } from '../../../application/usecases/commands/CreateRequestUseCase';
import { UpdateRequestUseCase } from '../../../application/usecases/commands/UpdateRequestUseCase';
import { GetConnectionRequestByIdUseCase } from '../../../application/usecases/commands/GetConnectionRequestByIdUseCase';
import { FindAllConnectionRequestsUseCase } from '../../../application/usecases/commands/FindAllConnectionRequestsUseCase';
import { DeleteConnectionRequestUseCase } from '../../../application/usecases/commands/DeleteConnectionRequestUseCase';
import { GetExpedienteUseCase } from '../../../application/usecases/commands/GetExpedienteUseCase';
import { GetHistorialEstadoUseCase } from '../../../application/usecases/commands/GetHistorialEstadoUseCase';
import { GetDashboardKpisUseCase } from '../../../application/usecases/commands/GetDashboardKpisUseCase';
import { GetOrdenesTrabajoUseCase } from '../../../application/usecases/commands/GetOrdenesTrabajoUseCase';
import { SubmitRequestUseCase } from '../../../application/usecases/commands/SubmitRequestUseCase';
import { SubmitWithDocumentsUseCase } from '../../../application/usecases/commands/SubmitWithDocumentsUseCase';
import { SubmitCorrectionsUseCase } from '../../../application/usecases/commands/SubmitCorrectionsUseCase';
import { RequestPostgreSQLPersistence } from '../../repositories/postgresql/persistence/request-postgresql.persistence';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { LocalFileStorageService } from '../../../../documents/infrastructure/services/storage/local-file-storage.service';
import { UploadFileService } from '../../../../documents/application/services/upload-file.service';
import { KafkaNotificationAdapter } from '../../../../../shared/notifications/kafka-notification.adapter';
import { GetExpedienteByClienteIdUseCase } from '../../../application/usecases/commands/GetExpedienteByClienteIdUseCase';
import { GetTrackingByClienteIdUseCase } from '../../../application/usecases/commands/GetTrackingByClienteIdUseCase';
import { GetExpedienteByAnalistaIdUseCase } from '../../../application/usecases/commands/GetExpedienteByAnalistaIdUseCase';
import { GetTrackingBySolicitudIdUseCase } from '../../../application/usecases/commands/GetTrackingBySolicitudIdUseCase';
import { GetTrackingByAnalistaIdUseCase } from '../../../application/usecases/commands/GetTrackingByAnalistaIdUseCase';
import { GetRequestDetailByRequestIdOrNumberUseCase } from '../../../application/usecases/commands/GetRequestDetailByRequestIdOrNumberUseCase';
import { GetNotificationValidationMatrixUseCase } from '../../../application/usecases/commands/GetNotificationValidationMatrixUseCase';
import { GetDashboardKpisByClientIdUseCase } from '../../../application/usecases/commands/GetDashboardKpisByClientIdUseCase';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [RequestController],
  providers: [
    CreateRequestUseCase,
    UpdateRequestUseCase,
    GetConnectionRequestByIdUseCase,
    FindAllConnectionRequestsUseCase,
    DeleteConnectionRequestUseCase,
    GetExpedienteUseCase,
    GetHistorialEstadoUseCase,
    GetDashboardKpisUseCase,
    GetOrdenesTrabajoUseCase,
    SubmitRequestUseCase,
    SubmitWithDocumentsUseCase,
    SubmitCorrectionsUseCase,
    GetExpedienteByClienteIdUseCase,
    GetTrackingByClienteIdUseCase,
    GetExpedienteByAnalistaIdUseCase,
    GetTrackingBySolicitudIdUseCase,
    GetTrackingByAnalistaIdUseCase,
    GetRequestDetailByRequestIdOrNumberUseCase,
    GetNotificationValidationMatrixUseCase,
    GetDashboardKpisByClientIdUseCase,
    UploadFileService,
    {
      provide: 'InterfaceFileStorageService',
      useClass: LocalFileStorageService,
    },
    {
      provide: 'INotificationPort',
      useClass: KafkaNotificationAdapter,
    },
    {
      provide: 'InterfaceConnectionRequestRepository',
      useClass: RequestPostgreSQLPersistence,
    },
  ],
  exports: [],
})
export class PostgresqlRequestModule {}
