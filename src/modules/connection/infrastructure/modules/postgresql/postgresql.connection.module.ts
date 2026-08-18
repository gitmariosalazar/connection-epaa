import { Module } from '@nestjs/common';
import { ConnectionController } from '../../controllers/connection.controller';
import { PostgresqlConnectionPersistence } from '../../repositories/postgresql/persistence/postgresql.connection.persistence';
import { MeterHistoryPostgresRecorder } from '../../services/postgresql/meter-history-recorder.service';
import { ConnectionService } from '../../../application/services/connection.service';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [ConnectionController],
  providers: [
    ConnectionService,
    {
      provide: 'ConnectionRepository',
      useClass: PostgresqlConnectionPersistence,
    },
    {
      provide: 'MeterHistoryRecorder',
      useClass: MeterHistoryPostgresRecorder,
    },
  ],
  exports: [],
})
export class PostgresConnectionModule {}
