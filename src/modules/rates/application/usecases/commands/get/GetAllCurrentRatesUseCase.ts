import { Inject, Injectable } from '@nestjs/common';
import { InterfaceRateRepository } from '../../../../domain/contracts/rate.interface.repository';
import { RateResponse } from '../../../dto/response/rate.response';
import { RateMapper } from '../../../mappers/rate.mapper';

@Injectable()
export class GetAllCurrentRatesUseCase {
  constructor(
    // Inject any necessary repositories or services here
    @Inject('InterfaceRateRepository')
    private readonly rateRepository: InterfaceRateRepository,
  ) {}

  async execute(): Promise<RateResponse[]> {
    try {
      const rateModels: RateResponse[] =
        await this.rateRepository.getCurrentRates();
      const rateResponses: RateResponse[] = rateModels.map((rateModel) =>
        RateMapper.toResponse(rateModel),
      );
      return rateResponses;
    } catch (error) {
      throw error;
    }
  }
}
