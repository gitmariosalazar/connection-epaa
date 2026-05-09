import { Module } from '@nestjs/common';
import { ConnectionController } from '../../controllers/connection.controller';
import { ConnectionService } from '../../../application/services/connection.service';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { MySQLConnectionPersistence } from '../../repositories/mysql/persistence/mysql.connection.persistence';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';

@Module({
  imports: [KafkaServiceModule, DatabasePersistenceModule],
  controllers: [ConnectionController],
  providers: [
    ConnectionService,
    {
      provide: 'ConnectionRepository',
      useClass: MySQLConnectionPersistence,
    },
  ],
  exports: [],
})
export class MySQLConnectionModule {}
