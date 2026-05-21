import { CadastralRegistrationModel } from '../schemas/models/CadastralRegistrationModel';

export interface InterfaceCadastralRepository {
  registerCadastral(registration: CadastralRegistrationModel): Promise<CadastralRegistrationModel | null>;
  changeRequestStatus(solicitudId: string, newStatus: string, userId: string, comment: string): Promise<void>;
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
}
