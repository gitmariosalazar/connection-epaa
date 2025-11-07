import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { environments } from "../../../../../settings/environments/environments";
import { DatabaseServicePostgreSQL } from "../../../../../shared/connections/database/postgresql/postgresql.service";
import { ObservationConnectionController } from "../../controllers/observation-connection.controller";
import { ObservationConnectionService } from "../../../application/services/observation-connection.service";
import { ObservationConnectionPostgreSqlPersistence } from "../../repositories/postgresql/persistence/postgresql.observation-connection.persistence";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: environments.OBSERVATION_CONNECTION_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [environments.KAFKA_BROKER_URL],
            clientId: environments.OBSERVATION_CONNECTION_KAFKA_CLIENT_ID
          },
          consumer: {
            groupId: environments.OBSERVATION_CONNECTION_KAFKA_GROUP_ID
          }
        }
      }
    ]),
  ],
  controllers: [
    ObservationConnectionController
  ],
  providers: [
    DatabaseServicePostgreSQL,
    ObservationConnectionService,
    {
      provide: 'ObservationConnectionRepository',
      useClass: ObservationConnectionPostgreSqlPersistence
    }
  ],
  exports: []
})
export class ObservationConnectionPostgreSQLModule { }