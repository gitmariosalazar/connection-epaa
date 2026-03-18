import { Controller } from '@nestjs/common';
import { GetAllCurrentRatesUseCase } from '../../application/usecases/commands/get/GetAllCurrentRatesUseCase';
import { MessagePattern } from '@nestjs/microservices';

@Controller('rates')
export class RateController {
  constructor(
    private readonly getAllCurrentRatesUseCase: GetAllCurrentRatesUseCase,
  ) {}

  @MessagePattern('rates.get-all-current-rates')
  async getAllCurrentRates() {
    try {
      const rates = await this.getAllCurrentRatesUseCase.execute();
      return rates;
    } catch (error) {
      throw error;
    }
  }
}
