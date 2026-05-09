import { Module } from '@nestjs/common';
import { ObservationConnectionController } from '../../controllers/observation-connection.controller';
import { ObservationConnectionService } from '../../../application/services/observation-connection.service';

import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabaseServiceMySQL } from '../../../../../shared/connections/database/mysql/mysql.service';
import { ObservationConnectionMySqlPersistence } from '../../repositories/mysql/persistence/mysql.observation-connection.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [ObservationConnectionController],
  providers: [
    DatabaseServiceMySQL,
    ObservationConnectionService,
    {
      provide: 'ObservationConnectionRepository',
      useClass: ObservationConnectionMySqlPersistence,
    },
  ],
  exports: [],
})
export class ObservationConnectionMySQLModule {}
