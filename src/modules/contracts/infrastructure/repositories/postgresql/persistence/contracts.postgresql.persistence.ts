import { Injectable } from '@nestjs/common';
import { DatabaseAbstract } from '../../../../../../shared/connections/database/abstract/abstract.database';
import { InterfaceContractsRepository } from '../../../../domain/contracts/contracts.interface.repository';
import { ContractModel } from '../../../../domain/schemas/models/ContractModel';

@Injectable()
export class ContractsPostgreSQLPersistence implements InterfaceContractsRepository {
  constructor(private readonly databaseService: DatabaseAbstract) {}

  async generateContract(contract: ContractModel): Promise<ContractModel | null> {
    const result = await this.databaseService.query<any>(
      `INSERT INTO acometidas.contrato_servicio
         (id_solicitud, numero_contrato, id_tarifa, costo_materiales, costo_mano_obra, tasa_conexion, id_generador)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id_contrato AS contract_id, id_solicitud AS solicitud_id,
         numero_contrato AS contract_number, estado_firma AS signature_status,
         costo_materiales AS material_cost, costo_mano_obra AS labor_cost,
         tasa_conexion AS connection_fee, valor_total AS total_value,
         created_at, updated_at`,
      [
        contract.solicitudId, contract.contractNumber, contract.tariffId,
        contract.materialCost, contract.laborCost, contract.connectionFee,
        contract.generatorId,
      ],
    );
    if (result.length === 0) return null;
    const r = result[0];
    return new ContractModel(
      r.contract_id, r.solicitud_id, r.contract_number, null,
      r.material_cost, r.labor_cost, r.connection_fee,
      r.signature_status, null, contract.generatorId, r.created_at, r.updated_at,
    );
  }

  async signContract(
    contractId: string, signatureStatus: string, signedContractUrl: string,
  ): Promise<{ solicitudId: string } | null> {
    const result = await this.databaseService.query<{ id_solicitud: string }>(
      `UPDATE acometidas.contrato_servicio
       SET estado_firma = $1, url_contrato_firmado = $2, updated_at = NOW()
       WHERE id_contrato = $3
       RETURNING id_solicitud`,
      [signatureStatus, signedContractUrl, contractId],
    );
    return result.length > 0 ? { solicitudId: result[0].id_solicitud } : null;
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
