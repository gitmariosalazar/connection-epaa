import { Inject, Injectable } from '@nestjs/common';
import { InterfaceConnectionRequestRepository } from '../../../domain/contracts/new-connection-request.interface.repository';
import { DashboardKpisResponse } from '../../dto/response/request-queries.response';

/**
 * SRP: Única responsabilidad — calcular los KPIs del dashboard
 * administrativo del módulo de acometidas para un cliente específico.
 */
@Injectable()
export class GetDashboardKpisByClientIdUseCase {
  constructor(
    @Inject('InterfaceConnectionRequestRepository')
    private readonly repository: InterfaceConnectionRequestRepository,
  ) {}

  async execute(clienteId: string): Promise<DashboardKpisResponse> {
    return await this.repository.getDashboardKpisByClienteId(clienteId);
  }
}
