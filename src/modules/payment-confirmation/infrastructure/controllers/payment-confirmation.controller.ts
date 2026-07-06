import { Body, Controller, Inject, Param, Patch } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfirmPaymentUseCase } from '../../application/usecases/ConfirmPaymentUseCase';
import { RejectPaymentUseCase } from '../../application/usecases/RejectPaymentUseCase';
import { ConfirmPaymentRequest } from '../../application/dto/request/confirm-payment.request';
import { RejectPaymentRequest } from '../../application/dto/request/reject-payment.request';

@Controller('payment-confirmation')
export class PaymentConfirmationController {
  constructor(
    @Inject(ConfirmPaymentUseCase)
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    @Inject(RejectPaymentUseCase)
    private readonly rejectPaymentUseCase: RejectPaymentUseCase,
  ) {}

  /**
   * FASE 5: Confirmación de Pago de Inspección
   * PATCH /payment-confirmation/facturas/:invoiceId/pagar
   */
  @Patch('facturas/:invoiceId/pagar')
  @MessagePattern('payment_confirmation.confirm_payment')
  async confirmPayment(@Payload() dto: ConfirmPaymentRequest) {
    return await this.confirmPaymentUseCase.execute(dto);
  }

  /**
   * RECHAZO DE PAGO DE INSPECCIÓN
   * payment_confirmation.reject_payment
   */
  @MessagePattern('payment_confirmation.reject_payment')
  async rejectPayment(@Payload() dto: RejectPaymentRequest) {
    return await this.rejectPaymentUseCase.execute(dto);
  }
}
