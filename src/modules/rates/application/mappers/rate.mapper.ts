import { RateModel } from '../../domain/schemas/models/rate.model';
import { RateResponse } from '../dto/response/rate.response';

export class RateMapper {
  static toResponse(rateModel: RateModel): RateResponse {
    return {
      rateId: rateModel.rateId,
      rateName: rateModel.rateName,
      rateDescription: rateModel.rateDescription,
      effectiveDate: rateModel.effectiveDate,
      endDate: rateModel.endDate,
    };
  }
}
