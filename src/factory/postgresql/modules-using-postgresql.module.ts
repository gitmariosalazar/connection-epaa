import { Module } from "@nestjs/common";
import { PostgresConnectionModule } from "../../modules/connection/infrastructure/modules/postgresql/postgresql.connection.module";
import { ObservationConnectionPostgreSQLModule } from "../../modules/observations/infrastructure/modules/postgresql/postgresql.observation-connection.module";
import { PhotoConnectionPostgreSQLModule } from "../../modules/images-connections/infrastructure/modules/postgresql/photo-connection.postgresql.module";


@Module({
  imports: [PostgresConnectionModule, ObservationConnectionPostgreSQLModule, PhotoConnectionPostgreSQLModule],
  controllers: [],
  providers: [],
  exports: []
})
export class AppConnectionModulesUsingPostgreSQL { }