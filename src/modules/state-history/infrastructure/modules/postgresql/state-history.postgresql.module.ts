import { Module } from '@nestjs/common';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { StateHistoryController } from '../../controllers/state-history.controller';

import { ChangeConnectionStateUseCase } from '../../../application/usecases/ChangeConnectionStateUseCase';
import { BulkChangeConnectionStateUseCase } from '../../../application/usecases/BulkChangeConnectionStateUseCase';
import { RevertStateHistoryUseCase } from '../../../application/usecases/RevertStateHistoryUseCase';
import { GetConnectionHistoryUseCase } from '../../../application/usecases/GetConnectionHistoryUseCase';
import { GetStateHistoryByIdUseCase } from '../../../application/usecases/GetStateHistoryByIdUseCase';
import { GetCurrentConnectionStateUseCase } from '../../../application/usecases/GetCurrentConnectionStateUseCase';
import { GetConnectionsByStateUseCase } from '../../../application/usecases/GetConnectionsByStateUseCase';
import { GetStateCatalogUseCase } from '../../../application/usecases/GetStateCatalogUseCase';
import { GetStateSummaryUseCase } from '../../../application/usecases/GetStateSummaryUseCase';
import { FilterStateHistoryUseCase } from '../../../application/usecases/FilterStateHistoryUseCase';
import { GetAllowedTransitionsUseCase } from '../../../application/usecases/GetAllowedTransitionsUseCase';
import { GetReversibleHistoryUseCase } from '../../../application/usecases/GetReversibleHistoryUseCase';
import { GetStateEventsGeoJSONUseCase } from '../../../application/usecases/GetStateEventsGeoJSONUseCase';

import { StateHistoryPostgreSQLPersistence } from '../../repositories/postgresql/persistence/state-history.postgresql.persistence';
import { KafkaStateHistoryEventPublisher } from '../../publishers/kafka-state-history-event.publisher';
import { KafkaConnectionSuspendedEventPublisher } from '../../publishers/kafka-connection-suspended.publisher';
import { DocumentsMicroserviceAdapter } from '../../adapters/documents-microservice.adapter';

@Module({
  imports: [DatabasePersistenceModule, KafkaServiceModule],
  controllers: [StateHistoryController],
  providers: [
    ChangeConnectionStateUseCase,
    BulkChangeConnectionStateUseCase,
    RevertStateHistoryUseCase,
    GetConnectionHistoryUseCase,
    GetStateHistoryByIdUseCase,
    GetCurrentConnectionStateUseCase,
    GetConnectionsByStateUseCase,
    GetStateCatalogUseCase,
    GetStateSummaryUseCase,
    FilterStateHistoryUseCase,
    GetAllowedTransitionsUseCase,
    GetReversibleHistoryUseCase,
    GetStateEventsGeoJSONUseCase,
    {
      provide: 'InterfaceStateHistoryRepository',
      useClass: StateHistoryPostgreSQLPersistence,
    },
    {
      provide: 'IStateHistoryEventPublisher',
      useClass: KafkaStateHistoryEventPublisher,
    },
    {
      provide: 'IConnectionSuspendedEventPublisher',
      useClass: KafkaConnectionSuspendedEventPublisher,
    },
    {
      provide: 'IDocumentService',
      useClass: DocumentsMicroserviceAdapter,
    },
  ],
  exports: [
    ChangeConnectionStateUseCase,
    BulkChangeConnectionStateUseCase,
    RevertStateHistoryUseCase,
    GetConnectionHistoryUseCase,
    GetStateHistoryByIdUseCase,
    GetCurrentConnectionStateUseCase,
    GetConnectionsByStateUseCase,
    GetStateCatalogUseCase,
    GetStateSummaryUseCase,
    FilterStateHistoryUseCase,
    GetAllowedTransitionsUseCase,
    GetReversibleHistoryUseCase,
    GetStateEventsGeoJSONUseCase,
    'InterfaceStateHistoryRepository',
    'IStateHistoryEventPublisher',
    'IConnectionSuspendedEventPublisher',
    'IDocumentService',
  ],
})
export class StateHistoryPostgreSQLModule {}
