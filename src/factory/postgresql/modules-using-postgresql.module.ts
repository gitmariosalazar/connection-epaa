import { Module } from "@nestjs/common";
import { PostgresConnectionModule } from "../../modules/connection/infrastructure/modules/postgresql/postgresql.connection.module";


@Module({
  imports: [PostgresConnectionModule],
  controllers: [],
  providers: [],
  exports: []
})
export class AppConnectionModulesUsingPostgreSQL { }