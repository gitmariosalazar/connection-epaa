import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
import { AppConnectionModulesUsingPostgreSQL } from './factory/postgresql/modules-using-postgresql.module';
import { AppConnectionModulesUsingMySQL } from './factory/mysql/modules-using-mysql.module';
import { environments } from './settings/environments/environments';
import { DatabasePersistenceModule } from './shared/connections/database/database-persistence.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

const connectionModules =
  environments.DATABASE_TYPE === 'mysql'
    ? AppConnectionModulesUsingMySQL
    : AppConnectionModulesUsingPostgreSQL;

@Module({
  imports: [
    HomeModule,
    connectionModules,
    DatabasePersistenceModule,
    ServeStaticModule.forRoot({
      rootPath: environments.CONNECTION_DOCUMENTS_UPLOAD_ROOT,
      serveRoot: '/uploads',
      serveStaticOptions: { index: false, redirect: false },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
