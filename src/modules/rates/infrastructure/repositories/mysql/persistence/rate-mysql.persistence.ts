import { Injectable } from '@nestjs/common';
import { InterfaceRateRepository } from '../../../../domain/contracts/rate.interface.repository';
import { DatabaseServicePostgreSQL } from '../../../../../../shared/connections/database/postgresql/postgresql.service';
import { RateModel } from '../../../../domain/schemas/models/rate.model';
import { RateSQLResult } from '../../../interfaces/sql/rate.sql.result';
import { RateAdapter } from '../../../adapters/rate.adapter';
import { RpcException } from '@nestjs/microservices';
import { statusCode } from '../../../../../../settings/environments/status-code';
import { DatabaseServiceMySQL } from '../../../../../../shared/connections/database/mysql/mysql.service';

@Injectable()
export class RateMySQLPersistence implements InterfaceRateRepository {
  constructor(private readonly mySQLService: DatabaseServiceMySQL) {}

  async getCurrentRates(): Promise<RateModel[]> {
    try {
      const query = `
      SELECT 
          t.tarifa_id AS rate_id,
          c.nombre AS rate_name,
          t.descripcion AS rate_description,
          t.effective_date,
          t.end_date
      FROM categoria c
      INNER JOIN tarifa t ON c.categoria_id = t.categoria_id
      WHERE CURRENT_DATE >= t.effective_date 
          AND (t.end_date IS NULL OR t.end_date >= CURRENT_DATE);
      `;

      const result: RateSQLResult[] =
        await this.mySQLService.query<RateSQLResult>(query);
      const rates: RateModel[] = result.map((rate) =>
        RateAdapter.toRateResponse(rate),
      );

      if (rates.length === 0) {
        throw new RpcException({
          statusCode: statusCode.NOT_FOUND,
          message: 'No current rates found',
        });
      }

      return rates;
    } catch (error) {
      throw error;
    }
  }
}
