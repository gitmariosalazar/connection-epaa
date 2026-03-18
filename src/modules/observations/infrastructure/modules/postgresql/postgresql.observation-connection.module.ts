import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { environments } from '../../../../../settings/environments/environments';
import { DatabaseServicePostgreSQL } from '../../../../../shared/connections/database/postgresql/postgresql.service';
import { ObservationConnectionController } from '../../controllers/observation-connection.controller';
import { ObservationConnectionService } from '../../../application/services/observation-connection.service';
import { ObservationConnectionPostgreSqlPersistence } from '../../repositories/postgresql/persistence/postgresql.observation-connection.persistence';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';

@Module({
  imports: [KafkaServiceModule],
  controllers: [ObservationConnectionController],
  providers: [
    DatabaseServicePostgreSQL,
    ObservationConnectionService,
    {
      provide: 'ObservationConnectionRepository',
      useClass: ObservationConnectionPostgreSqlPersistence,
    },
  ],
  exports: [],
})
export class ObservationConnectionPostgreSQLModule {}
