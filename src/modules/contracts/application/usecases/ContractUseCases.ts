import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceContractsRepository } from '../../domain/contracts/contracts.interface.repository';
import { ContractModel } from '../../domain/schemas/models/ContractModel';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

export class GenerateContractDto {
  solicitudId: string;
  contractNumber: string;
  tariffId?: number;
  materialCost: number;
  laborCost: number;
  connectionFee: number;
  generatorId: string;
}

/** Fase 12: Generación de Contrato (CONTRATO_GENERADO) */
@Injectable()
export class GenerateContractUseCase {
  constructor(
    @Inject('InterfaceContractsRepository')
    private readonly repository: InterfaceContractsRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(dto: GenerateContractDto): Promise<ContractModel> {
    const contract = new ContractModel(
      null, dto.solicitudId, dto.contractNumber, dto.tariffId ?? null,
      dto.materialCost, dto.laborCost, dto.connectionFee,
      'PENDIENTE', null, dto.generatorId,
    );

    const saved = await this.repository.generateContract(contract);
    if (!saved) throw new NotFoundException('No se pudo generar el contrato');

    await this.repository.changeRequestStatus(
      dto.solicitudId, 'CONTRATO_GENERADO', dto.generatorId,
      'Documento de contrato redactado y listo para firmas',
    );

    // Notificar al cliente que su contrato está listo (Fase 12)
    const clientId = await this.repository.getClientIdBySolicitud(dto.solicitudId);
    if (clientId) {
      this.notification.notifyContratoGenerado(clientId, dto.solicitudId, dto.contractNumber);
    }

    return saved;
  }
}

export class SignContractDto {
  contractId: string;
  signatureStatus: 'FIRMADO_CLIENTE' | 'FIRMADO_EPAA' | 'COMPLETO';
  signedContractUrl: string;
  userId: string;
}

/** Fase 13: Firma de Contrato (CONTRATO_FIRMADO) */
@Injectable()
export class SignContractUseCase {
  constructor(
    @Inject('InterfaceContractsRepository')
    private readonly repository: InterfaceContractsRepository,
  ) {}

  async execute(dto: SignContractDto): Promise<{ solicitudId: string; newStatus: string }> {
    const result = await this.repository.signContract(
      dto.contractId, dto.signatureStatus, dto.signedContractUrl,
    );
    if (!result) throw new NotFoundException(`Contrato ${dto.contractId} no encontrado`);

    // Solo transiciona a CONTRATO_FIRMADO cuando ambas partes firmaron
    if (dto.signatureStatus === 'COMPLETO') {
      await this.repository.changeRequestStatus(
        result.solicitudId, 'CONTRATO_FIRMADO', dto.userId,
        'Contrato legalmente suscrito por ambas partes',
      );
    }

    return { solicitudId: result.solicitudId, newStatus: dto.signatureStatus };
  }
}
