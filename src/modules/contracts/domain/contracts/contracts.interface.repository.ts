import { ContractModel } from '../schemas/models/ContractModel';

export interface InterfaceContractsRepository {
  generateContract(contract: ContractModel): Promise<ContractModel | null>;
  signContract(
    contractId: string,
    signatureStatus: string,
    signedContractUrl: string,
  ): Promise<{ solicitudId: string } | null>;
  changeRequestStatus(solicitudId: string, newStatus: string, userId: string, comment: string): Promise<void>;
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
}
