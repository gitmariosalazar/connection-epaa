import { Get, Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { InspectionReportController } from '../../controllers/inspection-report.controller';
import {
  SubmitInspectionReportUseCase,
  ApproveInspectionReportUseCase,
  GetWorkOrderInspectionDetailByOrderCodeOrRequestNumberUseCase,
} from '../../../application/usecases/InspectionReportUseCases';
import { InspectionReportPostgreSQLPersistence } from '../../repositories/postgresql/persistence/inspection-report.postgresql.persistence';
import { NotificationSharedModule } from '../../../../../shared/notifications/notification-shared.module';

@Module({
  imports: [
    KafkaServiceModule,
    DatabasePersistenceModule,
    NotificationSharedModule,
  ],
  controllers: [InspectionReportController],
  providers: [
    SubmitInspectionReportUseCase,
    ApproveInspectionReportUseCase,
    GetWorkOrderInspectionDetailByOrderCodeOrRequestNumberUseCase,
    {
      provide: 'InterfaceInspectionReportRepository',
      useClass: InspectionReportPostgreSQLPersistence,
    },
  ],
})
export class InspectionReportPostgreSQLModule {}
