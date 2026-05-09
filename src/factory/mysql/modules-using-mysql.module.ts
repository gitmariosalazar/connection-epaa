import { Module } from '@nestjs/common';
import { MySQLConnectionModule } from '../../modules/connection/infrastructure/modules/mysql/mysql.connection.module';
import { ObservationConnectionMySQLModule } from '../../modules/observations/infrastructure/modules/mysql/mysql.observation-connection.module';
import { PhotoConnectionMySQLModule } from '../../modules/images-connections/infrastructure/modules/mysql/photo-connection.mysql.module';
import { MySQLRateModule } from '../../modules/rates/infrastructure/modules/mysql/mysql.rate.module';

@Module({
  imports: [
    MySQLConnectionModule,
    ObservationConnectionMySQLModule,
    PhotoConnectionMySQLModule,
    MySQLRateModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppConnectionModulesUsingMySQL {}
