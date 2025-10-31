import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { environments } from "../../../../../settings/environments/environments";
import { ConnectionController } from "../../controllers/connection.controller";
import { PostgresqlConnectionPersistence } from "../../repositories/postgresql/persistence/postgresql.connection.persistence";
import { ConnectionService } from "../../../application/services/connection.service";
import { DatabaseServicePostgreSQL } from "../../../../../shared/connections/database/postgresql/postgresql.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: environments.CONNECTION_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: environments.CONNECTION_KAFKA_CLIENT_ID,
            brokers: [environments.KAFKA_BROKER_URL],
          },
          consumer: {
            groupId: environments.CONNECTION_KAFKA_GROUP_ID,
            allowAutoTopicCreation: true,
          },
        }
      }
    ])
  ],
  controllers: [ConnectionController],
  providers: [
    DatabaseServicePostgreSQL, ConnectionService,
    {
      provide: 'ConnectionRepository',
      useClass: PostgresqlConnectionPersistence
    }
  ],
  exports: []
})
export class PostgresConnectionModule { }
