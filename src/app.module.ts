import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
import { AppConnectionModulesUsingPostgreSQL } from './factory/postgresql/modules-using-postgresql.module';

@Module({
  imports: [HomeModule, AppConnectionModulesUsingPostgreSQL],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
