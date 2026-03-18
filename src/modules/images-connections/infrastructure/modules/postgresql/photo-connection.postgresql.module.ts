import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PhotoConnectionController } from '../../controllers/photo-connection.controller';
import { PhotoConnectionPostgreSQLPersistence } from '../../repositories/postgresql/persistence/postgresql.photo-connection.persistence';
import { environments } from '../../../../../settings/environments/environments';
import { DatabaseServicePostgreSQL } from '../../../../../shared/connections/database/postgresql/postgresql.service';
import { PhotoConnectionService } from '../../../application/services/photo-connection.service';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';

@Module({
  imports: [KafkaServiceModule],
  controllers: [PhotoConnectionController],
  providers: [
    DatabaseServicePostgreSQL,
    PhotoConnectionService,
    {
      provide: 'PhotoConnectionRepository',
      useClass: PhotoConnectionPostgreSQLPersistence,
    },
  ],
  exports: [],
})
export class PhotoConnectionPostgreSQLModule {}
