import { Module } from '@nestjs/common';
import { PostgresConnectionModule } from '../../modules/connection/infrastructure/modules/postgresql/postgresql.connection.module';
import { ObservationConnectionPostgreSQLModule } from '../../modules/observations/infrastructure/modules/postgresql/postgresql.observation-connection.module';
import { PhotoConnectionPostgreSQLModule } from '../../modules/images-connections/infrastructure/modules/postgresql/photo-connection.postgresql.module';
import { PostgreSQLRateModule } from '../../modules/rates/infrastructure/modules/postgresql/postgresql.rate.module';
import { PostgresqlRequestModule } from '../../modules/requests/infrastructure/modules/postgresql/postgresql.request.module';
import { PostgresqlConnectionDocumentModule } from '../../modules/documents/infrastructure/modules/postgresql/connection-document.postgresql.module';
import { InspectionInvoicePostgreSQLModule } from '../../modules/inspection-invoice/infrastructure/modules/postgresql/inspection-invoice.postgresql.module';
// Nuevos módulos del proceso BPMN de Acometidas
import { DocumentValidationPostgreSQLModule } from '../../modules/document-validation/infrastructure/modules/postgresql/document-validation.postgresql.module';
import { PaymentConfirmationPostgreSQLModule } from '../../modules/payment-confirmation/infrastructure/modules/postgresql/payment-confirmation.postgresql.module';
import { InspectionReportPostgreSQLModule } from '../../modules/inspection-report/infrastructure/modules/postgresql/inspection-report.postgresql.module';
import { ContractsPostgreSQLModule } from '../../modules/contracts/infrastructure/modules/postgresql/contracts.postgresql.module';
import { CadastralPostgreSQLModule } from '../../modules/cadastral/infrastructure/modules/postgresql/cadastral.postgresql.module';

@Module({
  imports: [
    // Módulos existentes
    PostgresConnectionModule,
    ObservationConnectionPostgreSQLModule,
    PhotoConnectionPostgreSQLModule,
    PostgreSQLRateModule,
    PostgresqlRequestModule,
    PostgresqlConnectionDocumentModule,
    InspectionInvoicePostgreSQLModule,
    // Nuevos módulos del proceso BPMN (Fases 3, 5, 8-9, 10-11, 14)
    DocumentValidationPostgreSQLModule,
    PaymentConfirmationPostgreSQLModule,
    InspectionReportPostgreSQLModule,
    ContractsPostgreSQLModule,
    CadastralPostgreSQLModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppConnectionModulesUsingPostgreSQL {}
