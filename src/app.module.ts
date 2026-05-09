import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
import { AppConnectionModulesUsingPostgreSQL } from './factory/postgresql/modules-using-postgresql.module';
import { AppConnectionModulesUsingMySQL } from './factory/mysql/modules-using-mysql.module';
import { environments } from './settings/environments/environments';
import { DatabasePersistenceModule } from './shared/connections/database/database-persistence.module';

const connectionModules = environments.DATABASE_TYPE === 'mysql'
  ? AppConnectionModulesUsingMySQL
  : AppConnectionModulesUsingPostgreSQL;

@Module({
  imports: [
    HomeModule, 
    connectionModules,
    DatabasePersistenceModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
