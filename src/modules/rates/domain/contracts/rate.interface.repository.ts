import { RateModel } from '../schemas/models/rate.model';

export interface InterfaceRateRepository {
  getCurrentRates(): Promise<RateModel[]>;
}
