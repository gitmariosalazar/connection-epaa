import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { RateController } from '../../controllers/rate.controller';
import { DatabaseServicePostgreSQL } from '../../../../../shared/connections/database/postgresql/postgresql.service';
import { GetAllCurrentRatesUseCase } from '../../../application/usecases/commands/get/GetAllCurrentRatesUseCase';
import { RatePostgreSQLPersistence } from '../../repositories/postgresql/persistence/rate-postgresql.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [RateController],
  providers: [
    DatabaseServicePostgreSQL,
    GetAllCurrentRatesUseCase,
    {
      provide: 'InterfaceRateRepository',
      useClass: RatePostgreSQLPersistence,
    },
  ],
})
export class PostgreSQLRateModule {}
