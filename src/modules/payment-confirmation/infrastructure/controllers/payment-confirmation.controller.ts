import { Controller, Patch } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfirmPaymentUseCase } from '../../application/usecases/ConfirmPaymentUseCase';
import { ConfirmPaymentRequest } from '../../application/dto/request/confirm-payment.request';

@Controller('payment-confirmation')
export class PaymentConfirmationController {
  constructor(private readonly confirmPaymentUseCase: ConfirmPaymentUseCase) {}

  /**
   * FASE 5: Confirmación de Pago de Inspección
   * PATCH /payment-confirmation/facturas/:invoiceId/pagar
   */
  @Patch('facturas/:invoiceId/pagar')
  @MessagePattern('payment_confirmation.confirm_payment')
  async confirmPayment(@Payload() dto: ConfirmPaymentRequest) {
    return await this.confirmPaymentUseCase.execute(dto);
  }
}
