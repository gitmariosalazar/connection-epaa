import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InterfaceCadastralRepository } from '../../domain/contracts/cadastral.interface.repository';
import { CadastralRegistrationModel } from '../../domain/schemas/models/CadastralRegistrationModel';
import { INotificationPort } from '../../../../shared/notifications/notification.port';

export class RegisterCadastralDto {
  solicitudId: string;
  contractId?: string;
  cadastralKey: string;
  meterNumber: string;
  exactAddress: string;
  longitude: number;
  latitude: number;
  connectionDiameter?: string;
  serviceType?: string;
  installationDate: string;
  accountNumber: string;
  registratorId: string;
}

/**
 * Fase 14: Registro Catastral y Activación (SUMINISTRO_ACTIVO)
 * Este es el cierre definitivo del proceso BPMN.
 * SRP: Registra el predio en catastro y activa el suministro en facturación.
 */
@Injectable()
export class RegisterCadastralAndActivateUseCase {
  constructor(
    @Inject('InterfaceCadastralRepository')
    private readonly repository: InterfaceCadastralRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
  ) {}

  async execute(dto: RegisterCadastralDto): Promise<{ solicitudId: string; accountNumber: string; status: string }> {
    const registration = new CadastralRegistrationModel(
      null, dto.solicitudId, dto.contractId ?? null,
      dto.cadastralKey, dto.meterNumber, dto.exactAddress,
      dto.longitude, dto.latitude, dto.connectionDiameter ?? null,
      dto.serviceType ?? null, dto.installationDate,
      dto.accountNumber, dto.registratorId,
    );

    // 1. Insertar registro catastral definitivo
    const saved = await this.repository.registerCadastral(registration);
    if (!saved) throw new NotFoundException('No se pudo registrar el predio en catastro');

    // 2. Transición de cierre (estado final del proceso BPMN)
    await this.repository.changeRequestStatus(
      dto.solicitudId,
      'SUMINISTRO_ACTIVO',
      dto.registratorId,
      'Proceso concluido. Suministro de agua ingresado a cartera de facturación',
    );

    // 3. Notificación final al cliente: su suministro está activo (BPMN Punto 3)
    const clientId = await this.repository.getClientIdBySolicitud(dto.solicitudId);
    if (clientId) {
      this.notification.notifySuministroActivo(
        clientId,
        dto.solicitudId,
        dto.accountNumber,
        dto.meterNumber,
      );
    }

    return {
      solicitudId: dto.solicitudId,
      accountNumber: dto.accountNumber,
      status: 'SUMINISTRO_ACTIVO',
    };
  }
}
