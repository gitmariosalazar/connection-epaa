import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PhotoConnectionController } from "../../controllers/photo-connection.controller";
import { PhotoConnectionPostgreSQLPersistence } from "../../repositories/postgresql/persistence/postgresql.photo-connection.persistence";
import { environments } from "../../../../../settings/environments/environments";
import { DatabaseServicePostgreSQL } from "../../../../../shared/connections/database/postgresql/postgresql.service";
import { PhotoConnectionService } from "../../../application/services/photo-connection.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: environments.PHOTO_CONNECTION_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [environments.KAFKA_BROKER_URL],
            clientId: environments.PHOTO_CONNECTION_KAFKA_CLIENT_ID
          },
          consumer: {
            groupId: environments.PHOTO_CONNECTION_KAFKA_GROUP_ID
          }
        }
      }
    ]),
  ],
  controllers: [
    PhotoConnectionController
  ],
  providers: [
    DatabaseServicePostgreSQL,
    PhotoConnectionService,
    {
      provide: 'PhotoConnectionRepository',
      useClass: PhotoConnectionPostgreSQLPersistence
    }
  ],
  exports: []
})
export class PhotoConnectionPostgreSQLModule { }