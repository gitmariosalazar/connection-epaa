import { RateResponse } from '../../application/dto/response/rate.response';
import { RateModel } from '../../domain/schemas/models/rate.model';
import { RateSQLResult } from '../interfaces/sql/rate.sql.result';

export class RateAdapter {
  static toRateResponse(rateSQLResult: RateSQLResult): RateModel {
    const rateModel: RateModel = {
      rateId: rateSQLResult.rate_id,
      rateName: rateSQLResult.rate_name,
      rateDescription: rateSQLResult.rate_description,
      effectiveDate: rateSQLResult.effective_date,
      endDate: rateSQLResult.end_date,
    };
    return rateModel;
  }
}
