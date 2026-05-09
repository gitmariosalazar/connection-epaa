import { Module } from '@nestjs/common';
import { PhotoConnectionController } from '../../controllers/photo-connection.controller';
import { PhotoConnectionService } from '../../../application/services/photo-connection.service';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { DatabaseServiceMySQL } from '../../../../../shared/connections/database/mysql/mysql.service';
import { PhotoConnectionMySQLPersistence } from '../../repositories/mysql/persistence/mysql.photo-connection.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [PhotoConnectionController],
  providers: [
    DatabaseServiceMySQL,
    PhotoConnectionService,
    {
      provide: 'PhotoConnectionRepository',
      useClass: PhotoConnectionMySQLPersistence,
    },
  ],
  exports: [],
})
export class PhotoConnectionMySQLModule {}
