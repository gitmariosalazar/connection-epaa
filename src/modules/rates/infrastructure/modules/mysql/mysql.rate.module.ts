import { Module } from '@nestjs/common';
import { KafkaServiceModule } from '../../../../../shared/kafka/kafka-service.module';
import { RateController } from '../../controllers/rate.controller';
import { GetAllCurrentRatesUseCase } from '../../../application/usecases/commands/get/GetAllCurrentRatesUseCase';
import { DatabaseServiceMySQL } from '../../../../../shared/connections/database/mysql/mysql.service';
import { RateMySQLPersistence } from '../../repositories/mysql/persistence/rate-mysql.persistence';

@Module({
  imports: [KafkaServiceModule],
  controllers: [RateController],
  providers: [
    DatabaseServiceMySQL,
    GetAllCurrentRatesUseCase,
    {
      provide: 'InterfaceRateRepository',
      useClass: RateMySQLPersistence,
    },
  ],
})
export class MySQLRateModule {}
