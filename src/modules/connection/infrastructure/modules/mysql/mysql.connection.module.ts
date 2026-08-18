import { Module } from '@nestjs/common';
import { ConnectionController } from '../../controllers/connection.controller';
import { ConnectionService } from '../../../application/services/connection.service';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { MySQLConnectionPersistence } from '../../repositories/mysql/persistence/mysql.connection.persistence';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { UploadFileService } from '../../../../documents/application/services/upload-file.service';
import { LocalFileStorageService } from '../../../../documents/infrastructure/services/storage/local-file-storage.service';
import { MeterHistoryMySQLRecorder } from '../../services/mysql/meter-history-recorder.service';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [ConnectionController],
  providers: [
    ConnectionService,
    UploadFileService,
    {
      provide: 'ConnectionRepository',
      useClass: MySQLConnectionPersistence,
    },
    {
      provide: 'MeterHistoryRecorder',
      useClass: MeterHistoryMySQLRecorder,
    },
    {
      provide: 'InterfaceFileStorageService',
      useClass: LocalFileStorageService,
    },
  ],
  exports: [],
})
export class MySQLConnectionModule {}
