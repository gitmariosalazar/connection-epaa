import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceCadastralRepository } from '../../../../domain/contracts/cadastral.interface.repository';
import { CadastralRegistrationModel } from '../../../../domain/schemas/models/CadastralRegistrationModel';

@Injectable()
export class CadastralPostgreSQLPersistence implements InterfaceCadastralRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async registerCadastral(reg: CadastralRegistrationModel): Promise<CadastralRegistrationModel | null> {
    const result = await this.databaseService.query<any>(
      `INSERT INTO acometidas.registro_catastral (
         id_solicitud, id_contrato, clave_catastral, numero_medidor,
         direccion_exacta, geom, diametro_conexion, tipo_servicio,
         fecha_instalacion, numero_cuenta, activo, fecha_activacion, id_registrador
       ) VALUES ($1, $2, $3, $4, $5,
         ST_SetSRID(ST_MakePoint($6, $7), 4326),
         $8, $9, $10, $11, TRUE, NOW(), $12)
       RETURNING
         id_registro AS registration_id,
         id_solicitud AS solicitud_id,
         numero_cuenta AS account_number,
         activo AS active,
         created_at`,
      [
        reg.solicitudId, reg.contractId, reg.cadastralKey, reg.meterNumber,
        reg.exactAddress, reg.longitude, reg.latitude,
        reg.connectionDiameter, reg.serviceType, reg.installationDate,
        reg.accountNumber, reg.registratorId,
      ],
    );
    if (result.length === 0) return null;
    const r = result[0];
    return new CadastralRegistrationModel(
      r.registration_id, reg.solicitudId, reg.contractId,
      reg.cadastralKey, reg.meterNumber, reg.exactAddress,
      reg.longitude, reg.latitude, reg.connectionDiameter,
      reg.serviceType, reg.installationDate, r.account_number,
      reg.registratorId, r.created_at,
    );
  }

  async changeRequestStatus(solicitudId: string, newStatus: string, userId: string, comment: string): Promise<void> {
    await this.databaseService.query(
      `SELECT acometidas.fn_cambiar_estado_solicitud($1, $2, $3, $4)`,
      [solicitudId, newStatus, userId, comment],
    );
  }

  async getClientIdBySolicitud(solicitudId: string): Promise<string | null> {
    const result = await this.databaseService.query<{ id_cliente: string }>(
      `SELECT id_cliente FROM acometidas.solicitud WHERE id_solicitud = $1`,
      [solicitudId],
    );
    return result.length > 0 ? result[0].id_cliente : null;
  }
}
