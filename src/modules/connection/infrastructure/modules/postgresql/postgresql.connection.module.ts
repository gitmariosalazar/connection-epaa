import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { environments } from '../../../../../settings/environments/environments';
import { ConnectionController } from '../../controllers/connection.controller';
import { PostgresqlConnectionPersistence } from '../../repositories/postgresql/persistence/postgresql.connection.persistence';
import { ConnectionService } from '../../../application/services/connection.service';
import { DatabaseServicePostgreSQL } from '../../../../../shared/connections/database/postgresql/postgresql.service';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';

@Module({
  imports: [KafkaServiceModule],
  controllers: [ConnectionController],
  providers: [
    DatabaseServicePostgreSQL,
    ConnectionService,
    {
      provide: 'ConnectionRepository',
      useClass: PostgresqlConnectionPersistence,
    },
  ],
  exports: [],
})
export class PostgresConnectionModule {}
