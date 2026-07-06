import { Module } from '@nestjs/common';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
import { InstallationReportController } from '../../controllers/installation-report.controller';
import { SubmitInstallationReportUseCase } from '../../../application/usecases/InstallationReportUseCases';
import { InstallationReportPostgreSQLPersistence } from '../../repositories/postgresql/persistence/installation-report.postgresql.persistence';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [InstallationReportController],
  providers: [
    SubmitInstallationReportUseCase,
    {
      provide: 'InterfaceInstallationReportRepository',
      useClass: InstallationReportPostgreSQLPersistence,
    },
  ],
})
export class InstallationReportPostgreSQLModule {}
